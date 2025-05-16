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
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { edgeRateLimit } from '@/lib/edge-rate-limit';
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
        const { email, name, password, deviceFingerprint, role = 'CUSTOMER', address, firstName, lastName, phone, gateCode, serviceDay, startDate, isOneTimeService, paymentMethodId, referralCode, serviceType, } = body;
        // Validate required fields based on role
        if (!email || !name || !password) {
            return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
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
        const verificationToken = uuidv4();
        const verificationTokenExpiry = new Date();
        verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);
        // Create Stripe customer
        const stripeCustomer = await stripeInstance.customers.create({
            email,
            name: `${firstName} ${lastName}`,
            phone,
            payment_method: paymentMethodId,
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        // Find referrer if referral code provided
        let referrerId = null;
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
        const newReferralCode = `${firstName.substring(0, 3)}${lastName.substring(0, 3)}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`.toUpperCase();
        // Create user and customer in transaction
        const { user, customer } = await prisma.$transaction(async (tx) => {
            // Create user
            const newUser = await tx.user.create({
                data: Object.assign(Object.assign({ email,
                    name, password: hashedPassword, role,
                    deviceFingerprint,
                    verificationToken,
                    verificationTokenExpiry }, (role === 'CUSTOMER' && {
                    customer: {
                        create: {
                            address: address && {
                                create: {
                                    street: address.street,
                                    city: address.city,
                                    state: address.state,
                                    zipCode: address.zipCode
                                }
                            }
                        }
                    }
                })), (role === 'EMPLOYEE' && {
                    employee: {
                        create: {}
                    }
                })),
                include: {
                    customer: {
                        include: {
                            address: true
                        }
                    },
                    employee: true
                }
            });
            // Create customer
            const newCustomer = await tx.customer.create({
                data: {
                    userId: newUser.id,
                    stripeCustomerId: stripeCustomer.id,
                    phone,
                    gateCode,
                    serviceDay,
                    referralCode: newReferralCode,
                    address: {
                        create: {
                            street: address === null || address === void 0 ? void 0 : address.street,
                            city: address === null || address === void 0 ? void 0 : address.city,
                            state: address === null || address === void 0 ? void 0 : address.state,
                            zipCode: address === null || address === void 0 ? void 0 : address.zipCode
                        }
                    },
                },
            });
            return { user: newUser, customer: newCustomer };
        });
        // Create referral record if referrerId is provided
        if (referrerId) {
            try {
                await prisma.referral.create({
                    data: {
                        referrerId: referrerId,
                        referredId: customer.id,
                        code: newReferralCode,
                        status: 'COMPLETED'
                    }
                });
            }
            catch (error) {
                console.error('Error creating referral:', error);
                // Continue execution, don't fail signup if referral creation fails
            }
        }
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
                    planId: serviceType,
                    startDate: new Date()
                },
            });
            // Schedule first service based on preferred day
            await prisma.service.create({
                data: {
                    customerId: customer.id,
                    scheduledDate: new Date(startDate),
                    status: 'SCHEDULED',
                    servicePlanId: serviceType
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
            // Create one-time service
            await prisma.service.create({
                data: {
                    customerId: customer.id,
                    scheduledDate: new Date(startDate),
                    status: 'SCHEDULED',
                    servicePlanId: serviceType
                },
            });
        }
        // Create JWT token for authentication
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ userId: user.id, role: user.role, customerId: customer.id })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('1d')
            .sign(secret);
        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set({
            name: 'accessToken',
            value: token,
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
        });
        // Fetch customer with address
        const customerWithAddress = await prisma.customer.findUnique({
            where: { id: customer.id },
            include: { address: true }
        });
        // Remove sensitive data before sending response
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        const response = NextResponse.json({
            user: userWithoutPassword,
            customer: {
                id: customer.id,
                phone: customer.phone,
                address: (customerWithAddress === null || customerWithAddress === void 0 ? void 0 : customerWithAddress.address) ? {
                    street: customerWithAddress.address.street,
                    city: customerWithAddress.address.city,
                    state: customerWithAddress.address.state,
                    zipCode: customerWithAddress.address.zipCode
                } : null,
            },
            subscription,
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
