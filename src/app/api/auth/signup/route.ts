import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { addDays } from 'date-fns'
import { getSubscriptionPlans, getOneTimeServices } from '@/lib/constants'
import { validatePassword } from '@/lib/password'

export async function POST(request: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      street,
      city,
      state,
      zipCode,
      gateCode,
      serviceType,
      serviceDay,
      startDate,
      isOneTimeService,
      paymentMethodId,
      referralCode
    } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !street || 
        !city || !state || !zipCode || !serviceType || !startDate || !paymentMethodId) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid password',
          details: passwordValidation.errors,
          strength: passwordValidation.strength
        },
        { status: 400 }
      )
    }

    // Get prices from Stripe
    const [subscriptionPlans, oneTimeServices] = await Promise.all([
      getSubscriptionPlans(),
      getOneTimeServices()
    ]);

    // Find the selected plan
    const selectedPlan = isOneTimeService 
      ? oneTimeServices.find(plan => plan.id === serviceType)
      : subscriptionPlans.find(plan => plan.id === serviceType);

    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid service type selected' },
        { status: 400 }
      );
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

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
      phone,
      metadata: {
        serviceType,
        isOneTimeService: isOneTimeService ? 'true' : 'false',
        serviceDay: serviceDay || 'none'
      }
    })

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id
    })

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    // Create subscription or one-time payment
    let stripeSubscription;
    let paymentIntent;
    
    if (!isOneTimeService) {
      // Create subscription
      stripeSubscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: selectedPlan.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card']
        },
        expand: ['latest_invoice.payment_intent']
      })
    } else {
      // Create one-time payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: selectedPlan.amount,
        currency: 'usd',
        customer: customer.id,
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          serviceType,
          isOneTimeService: 'true'
        }
      })
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user, customer, address, and subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'CUSTOMER',
          name: `${firstName} ${lastName}`,
          customer: {
            create: {
              stripeCustomerId: customer.id,
              email,
              phone,
              gateCode: gateCode || null,
              serviceDay: serviceDay || null,
              referralCode: referralCode || null,
              address: {
                create: {
                  street,
                  city,
                  state,
                  zipCode
                }
              },
              subscription: !isOneTimeService ? {
                create: {
                  plan: selectedPlan.plan,
                  startDate: new Date(startDate),
                  nextBilling: addDays(new Date(startDate), selectedPlan.interval === 'week' ? 7 : 14),
                  status: 'PENDING',
                  stripeSubscriptionId: stripeSubscription?.id
                }
              } : undefined
            }
          }
        },
        include: {
          customer: {
            include: {
              address: true,
              subscription: true
            }
          }
        }
      })

      return user
    })

    return NextResponse.json({
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        customer: result.customer
      },
      subscription: !isOneTimeService ? {
        id: stripeSubscription?.id,
        status: stripeSubscription?.status,
        clientSecret: (stripeSubscription?.latest_invoice as any)?.payment_intent?.client_secret
      } : {
        id: paymentIntent?.id,
        status: paymentIntent?.status,
        clientSecret: paymentIntent?.client_secret
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 