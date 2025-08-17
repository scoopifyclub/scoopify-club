var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from "@/lib/prisma";
import { validatePassword } from '@/lib/password';
import { v4 as uuidv4 } from 'uuid';
import { createUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { edgeRateLimit } from '@/lib/edge-rate-limit';
import crypto from 'crypto';

// Force Node.js runtime for bcryptjs, crypto, and Prisma
export const runtime = 'nodejs';

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
export async function POST(request) {
    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        
        // Apply rate limiting
        const rateLimitResult = await edgeRateLimit.limit(request);
        if (rateLimitResult) {
            return rateLimitResult;
        }

        const body = await request.json();
        const { email, firstName, lastName, password, deviceFingerprint, role = 'CUSTOMER', address, phone, gateCode, serviceDay, startDate, isOneTimeService, paymentMethodId, referralCode, serviceType, travelDistance, coveredZips } = body;
        // Validate required fields based on role
        if (!email || !firstName || !lastName || !password) {
            return NextResponse.json({ error: 'Email, first name, last name, and password are required' }, { status: 400 });
        }
        // deviceFingerprint is only required for customers
        if (role === 'CUSTOMER' && !deviceFingerprint) {
            return NextResponse.json({ error: 'Device fingerprint is required for customers' }, { status: 400 });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }
        // Validate password strength
        const validation = validatePassword(password);
        if (!validation.isValid) {
            return NextResponse.json({
                error: 'Password does not meet requirements',
                details: validation.errors,
                strength: validation.strength
            }, { status: 400 });
        }
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }
        // Hash password
        const hashedPassword = await hash(password, 12);
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        let stripeCustomer = null;
        let referrerId = null;
        let newReferralCode = null;

        // Only create Stripe customer and handle referrals for customer signups
        if (role === 'CUSTOMER') {
            // Check if the customer's ZIP code is covered by any active scooper using proximity
            if (!address?.zipCode) {
                return NextResponse.json({ error: 'ZIP code is required for customers' }, { status: 400 });
            }
            
            // Get all active coverage areas and check proximity
            const activeCoverageAreas = await prisma.coverageArea.findMany({
                where: { active: true },
                select: {
                    id: true,
                    zipCode: true,
                    employeeId: true,
                    travelDistance: true
                }
            });
            
            // Import and use proximity check
            const { checkCustomerCoverage } = await import('@/lib/zip-proximity');
            const coverageResult = checkCustomerCoverage(address.zipCode, activeCoverageAreas);
            
            if (!coverageResult.isCovered) {
                return NextResponse.json({ 
                    error: `Sorry, we do not currently service your area. ${coverageResult.reason || 'No active scoopers within range.'}` 
                }, { status: 400 });
            }
            // Create Stripe customer
            stripeCustomer = await stripeInstance.customers.create({
                email,
                name: `${firstName} ${lastName}`,
                phone,
                payment_method: paymentMethodId,
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
                metadata: {
                    deviceFingerprint
                }
            });

            // Find referrer if referral code provided
            if (referralCode) {
                const referrer = await prisma.customer.findFirst({
                    where: { referralCode },
                    select: { id: true },
                });
                if (referrer) {
                    referrerId = referrer.id;
                }
            }

            // Create a unique referral code for this new customer
            newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        }

        // Create user and profile in transaction
        console.log('Starting database transaction for role:', role);
        console.log('Covered ZIPs:', coveredZips);
        console.log('Travel distance:', travelDistance);
        
        let transactionResult;
        try {
            transactionResult = await prisma.$transaction(async (tx) => {
            // Create user
            const newUser = await tx.user.create({
                data: {
                    id: crypto.randomUUID(),
                    email,
                    firstName,
                    lastName,
                    password: hashedPassword,
                    role,
                    deviceFingerprint,
                    verificationToken,
                    verificationTokenExpiry,
                    updatedAt: new Date(),
                    createdAt: new Date()
                }
            });

            let customer = null;
            let employee = null;

            if (role === 'EMPLOYEE') {
                console.log('Creating employee with phone:', phone);
                // Create employee first
                employee = await tx.employee.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: newUser.id,
                        phone,
                        status: 'ACTIVE',
                        updatedAt: new Date(),
                        createdAt: new Date(),
                        hasSetServiceArea: !!address?.zipCode // Set to true if zipCode provided
                    }
                });
                console.log('Employee created successfully:', employee.id);
            } else if (role === 'CUSTOMER') {
                customer = await tx.customer.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: newUser.id,
                        stripeCustomerId: stripeCustomer?.id,
                        phone,
                        gateCode,
                        serviceDay,
                        referralCode: newReferralCode,
                        updatedAt: new Date(),
                        createdAt: new Date(),
                        ...(address && {
                            address: {
                                create: {
                                    id: crypto.randomUUID(),
                                    street: address.street,
                                    city: address.city,
                                    state: address.state,
                                    zipCode: address.zipCode,
                                    updatedAt: new Date()
                                }
                            }
                        })
                    },
                    include: {
                        address: true
                    }
                });
            }

            return { 
                user: newUser, 
                customer, 
                employee 
            };
            });
            
            console.log('Database transaction completed successfully');
        } catch (transactionError) {
            console.error('Database transaction failed:', transactionError);
            throw new Error(`Database transaction failed: ${transactionError.message}`);
        }
        
        const { user, customer, employee } = transactionResult;

        // Create coverage areas for employees (outside transaction to avoid timeout)
        if (role === 'EMPLOYEE' && employee) {
            console.log('Creating coverage areas outside transaction...');
            const zipCodesToCover = Array.isArray(coveredZips) && coveredZips.length > 0 ? coveredZips : (address?.zipCode ? [address.zipCode] : []);
            console.log('ZIP codes to cover:', zipCodesToCover);
            console.log('Travel distance for coverage areas:', travelDistance);
            
            try {
                for (const zip of zipCodesToCover) {
                    console.log('Creating coverage area for ZIP:', zip);
                    await prisma.coverageArea.create({
                        data: {
                            id: crypto.randomUUID(),
                            employeeId: employee.id,
                            zipCode: zip,
                            active: true,
                            travelDistance: travelDistance || 20, // Default to 20 miles
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    });
                    console.log('Coverage area created for ZIP:', zip);
                }
                console.log('All coverage areas created successfully');
            } catch (coverageError) {
                console.error('Error creating coverage areas:', coverageError);
                // Don't fail the entire signup if coverage areas fail
                // The employee can still be created and coverage areas can be added later
            }
        }

        // Only handle subscriptions and payments for customers
        if (role === 'CUSTOMER') {
            // Create referral record if referrerId is provided
            if (referrerId) {
                try {
                    await prisma.referral.create({
                        data: {
                            id: crypto.randomUUID(),
                            referrerId: referrerId,
                            referredId: customer.id,
                            code: newReferralCode,
                            status: 'COMPLETED'
                        }
                    });
                } catch (error) {
                    console.error('Error creating referral:', error);
                }
            }

            // Handle customer-specific operations (setup fee, subscription, etc.)
            // Create and charge for first-time setup fee - $30
            const setupFeeAmount = 3000; // $30.00 in cents
            const setupFeePaymentIntent = await stripeInstance.paymentIntents.create({
                amount: setupFeeAmount,
                currency: 'usd',
                customer: stripeCustomer.id,
                payment_method: paymentMethodId,
                description: 'Initial Cleanup Fee',
                metadata: {
                    customerId: customer.id,
                    userId: user.id,
                    type: 'SETUP_FEE'
                },
                confirm: true,
            });
            // Create subscription or one-time service
            let subscription = null;
            if (!isOneTimeService) {
                // Get price ID based on service type
                let priceId;
                switch (serviceType) {
                    case 'weekly-1':
                        priceId = process.env.STRIPE_WEEKLY_1_DOG_PRICE_ID;
                        break;
                    case 'weekly-2':
                        priceId = process.env.STRIPE_WEEKLY_2_DOGS_PRICE_ID;
                        break;
                    case 'weekly-3':
                        priceId = process.env.STRIPE_WEEKLY_3_PLUS_DOGS_PRICE_ID;
                        break;
                    case 'one-time-1':
                        priceId = process.env.STRIPE_ONE_TIME_1_DOG_PRICE_ID;
                        break;
                    case 'one-time-2':
                        priceId = process.env.STRIPE_ONE_TIME_2_DOGS_PRICE_ID;
                        break;
                    case 'one-time-3':
                        priceId = process.env.STRIPE_ONE_TIME_3_PLUS_DOGS_PRICE_ID;
                        break;
                    default:
                        return NextResponse.json({ error: 'Invalid service type' }, { status: 400 });
                }

                // Find the corresponding ServicePlan in the database
                const servicePlan = await prisma.servicePlan.findFirst({
                    where: {
                        OR: [
                            { name: serviceType },
                            { code: serviceType },
                            { stripePriceId: priceId }
                        ],
                        isActive: true
                    }
                });

                if (!servicePlan) {
                    console.error(`ServicePlan not found for serviceType: ${serviceType}, priceId: ${priceId}`);
                    return NextResponse.json({ 
                        error: 'Service plan not found. Please contact support.' 
                    }, { status: 400 });
                }

                // Create subscription
                const stripeSubscription = await stripeInstance.subscriptions.create({
                    customer: stripeCustomer.id,
                    items: [{ price: priceId }],
                    default_payment_method: paymentMethodId,
                    metadata: {
                        customerId: customer.id,
                        userId: user.id,
                    },
                });
                // Save subscription to DB
                subscription = await prisma.subscription.create({
                    data: {
                        customerId: customer.id,
                        status: stripeSubscription.status,
                        planId: servicePlan.id, // Use the actual ServicePlan ID
                        startDate: new Date(),
                        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000)
                    },
                });
                // Schedule first service based on preferred day
                await prisma.service.create({
                    data: {
                        id: crypto.randomUUID(),
                        customerId: customer.id,
                        scheduledDate: new Date(startDate),
                        status: 'SCHEDULED',
                        servicePlanId: servicePlan.id // Use the actual ServicePlan ID
                    },
                });
            }
            else {
                // Handle one-time service
                const oneTimeAmount = serviceType === 'one-time-basic' ? 5000 : 7500; // $50 or $75
                const paymentIntent = await stripeInstance.paymentIntents.create({
                    amount: oneTimeAmount,
                    currency: 'usd',
                    customer: stripeCustomer.id,
                    payment_method: paymentMethodId,
                    description: serviceType === 'one-time-basic' ? 'Basic One-Time Service' : 'Premium One-Time Service',
                    metadata: {
                        customerId: customer.id,
                        userId: user.id,
                        type: 'ONE_TIME'
                    },
                    confirm: true,
                });

                // Find the corresponding ServicePlan for one-time service
                const oneTimeServicePlan = await prisma.servicePlan.findFirst({
                    where: {
                        OR: [
                            { name: serviceType },
                            { code: serviceType },
                            { type: 'ONE_TIME' }
                        ],
                        isActive: true
                    }
                });

                if (!oneTimeServicePlan) {
                    console.error(`One-time ServicePlan not found for serviceType: ${serviceType}`);
                    return NextResponse.json({ 
                        error: 'One-time service plan not found. Please contact support.' 
                    }, { status: 400 });
                }

                // Create one-time service
                await prisma.service.create({
                    data: {
                        id: crypto.randomUUID(),
                        customerId: customer.id,
                        scheduledDate: new Date(startDate),
                        status: 'SCHEDULED',
                        servicePlanId: oneTimeServicePlan.id // Use the actual ServicePlan ID
                    },
                });
            }
        }

        // Create JWT token for authentication
        const token = await createUserToken({ 
            id: user.id, 
            email: user.email,
            role: user.role
        });

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set({
            name: 'token',
            value: token,
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
        });

        // Remove sensitive data before sending response
        const { password: _, ...userWithoutPassword } = user;
        
        const response = NextResponse.json({
            user: userWithoutPassword,
            customer,
            employee,
            token,
        }, { status: 201 });

        // Add rate limit headers if available
        if (rateLimitResult?.headers) {
            Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
                response.headers.set(key, value);
            });
        }

        return response;
    }
    catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}
