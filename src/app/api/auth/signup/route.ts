import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { addDays } from 'date-fns'
import { getSubscriptionPlans, getOneTimeServices } from '@/lib/constants'

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
    } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !street || 
        !city || !state || !zipCode || !serviceType || !startDate) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
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
              phone,
              gateCode: gateCode || null,
              preferredDay: serviceDay || null,
              address: {
                create: {
                  street,
                  city,
                  state,
                  zipCode,
                }
              },
              subscription: {
                create: {
                  stripeSubscriptionId: 'pending',
                  status: 'PENDING',
                  frequency: isOneTimeService ? 'ONE_TIME' : 'MONTHLY',
                  pricePerVisit: selectedPlan.price,
                  startDate: new Date(startDate),
                  nextBillingDate: isOneTimeService ? null : addDays(new Date(startDate), 30),
                }
              }
            }
          }
        },
        include: {
          customer: {
            include: {
              subscription: true,
              address: true
            }
          }
        }
      })

      // Create service record
      await tx.service.create({
        data: {
          customerId: user.customer!.id,
          scheduledFor: new Date(startDate),
          status: 'SCHEDULED',
          type: isOneTimeService ? 'ONE_TIME' : 'REGULAR',
          amount: selectedPlan.price
        }
      })

      return user
    })

    // Create a setup intent for adding payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        userId: result.id
      }
    })

    return NextResponse.json({
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        customer: result.customer
      },
      setupIntent: {
        clientSecret: setupIntent.client_secret
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
} 