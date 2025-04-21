import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import prisma from "@/lib/prisma";
import { stripe } from '@/lib/stripe'
import { addDays } from 'date-fns'
import { getSubscriptionPlans, getOneTimeServices } from '@/lib/constants'
import { validatePassword } from '@/lib/password'
import { v4 as uuidv4 } from 'uuid'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email,
      name,
      password,
      deviceFingerprint,
      role = 'CUSTOMER',
      address,
      firstName,
      lastName,
      phone,
      gateCode,
      serviceDay,
      startDate,
      isOneTimeService,
      paymentMethodId,
      referralCode,
    } = body

    // Validate required fields
    if (!email || !name || !password || !deviceFingerprint) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Validate password strength
    const validation = validatePassword(password)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: validation.errors,
          strength: validation.strength
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Generate verification token
    const verificationToken = uuidv4()
    const verificationTokenExpiry = new Date()
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24)

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
        data: {
          email,
          name,
          password: hashedPassword,
          role,
          deviceFingerprint,
          verificationToken,
          verificationTokenExpiry,
          ...(role === 'CUSTOMER' && {
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
          }),
          ...(role === 'EMPLOYEE' && {
            employee: {
              create: {}
            }
          })
        },
        include: {
          customer: {
            include: {
              address: true
            }
          },
          employee: true
        }
      })

      // Create customer
      const newCustomer = await tx.customer.create({
        data: {
          userId: newUser.id,
          stripeCustomerId: stripeCustomer.id,
          phone,
          gateCode,
          serviceDay,
          referralCode: newReferralCode,
          referredById: referrerId,
          address: {
            create: {
              street: address?.street,
              city: address?.city,
              state: address?.state,
              zipCode: address?.zipCode
            }
          },
        },
      })

      return { user: newUser, customer: newCustomer };
    })

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
        case 'weekly':
          priceId = process.env.STRIPE_WEEKLY_PRICE_ID;
          break;
        case 'biweekly':
          priceId = process.env.STRIPE_BIWEEKLY_PRICE_ID;
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid service type' },
            { status: 400 }
          );
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
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          planId: serviceType,
        },
      });

      // Schedule first service based on preferred day
      await prisma.service.create({
        data: {
          customerId: customer.id,
          scheduledDate: new Date(startDate),
          status: 'SCHEDULED',
          type: 'REGULAR',
          servicePlanId: serviceType,
        },
      });
    } else {
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
          type: 'ONE_TIME',
          servicePlanId: serviceType,
        },
      });
    }

    // Create JWT token for authentication
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
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

    // Remove sensitive data before sending response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        user: userWithoutPassword,
        customer: {
          id: customer.id,
          phone: customer.phone,
          address: {
            street: customer.address.street,
            city: customer.address.city,
            state: customer.address.state,
            zipCode: customer.address.zipCode
          },
        },
        subscription,
        token,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 