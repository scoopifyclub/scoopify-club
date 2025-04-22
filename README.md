# ScoopifyClub

A comprehensive web application for managing dog waste removal services, employee scheduling, and customer subscriptions.

![ScoopifyClub Logo](public/logo.png)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Running Locally](#running-locally)
- [Database Configuration](#database-configuration)
- [Authentication System](#authentication-system)
- [Payment System](#payment-system)
- [Testing](#testing)
  - [Unit and Integration Tests](#unit-and-integration-tests)
  - [E2E Testing](#e2e-testing)
- [Deployment](#deployment)
  - [Vercel Deployment](#vercel-deployment)
  - [Environment Variables for Production](#environment-variables-for-production)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🔍 Overview

ScoopifyClub is a platform that connects pet owners with professional dog waste removal services. The app manages customer subscriptions, employee scheduling, service tracking, and payment processing, offering a seamless experience for all users.

## 🌟 Key Features

### Multi-Role Authentication
- **Customer Portal**: Subscription management, service scheduling, billing history
- **Employee Dashboard**: Service claiming, scheduling, route optimization, earnings tracking
- **Admin Console**: User management, payment approvals, analytics, service monitoring

### Business Operations
- **Subscription Management**: Weekly, bi-weekly, and one-time service options
- **Service Scheduling**: Automatic scheduling based on customer preferences
- **Referral System**: Customers earn rewards for referring others
- **Payment Processing**: Integration with Stripe for secure payments
- **Earning Distribution**: Automated payment distribution to employees

### Technical Features
- **Responsive Design**: Mobile and desktop optimized interfaces
- **Real-time Updates**: Instant notifications for service status changes
- **Location Services**: Service area mapping and route optimization
- **Photo Documentation**: Before/after service photos
- **Audit System**: Complete payment and service tracking

## 💻 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Styling**: TailwindCSS with custom theme
- **Forms**: React Hook Form with Zod validation
- **Maps Integration**: Google Maps API
- **State Management**: React Context and Hooks

### Backend
- **API Routes**: Next.js API routes with route handlers
- **Authentication**: Custom JWT-based auth with cookie storage
- **Database ORM**: Prisma 6
- **Payment Processing**: Stripe API
- **Email**: Resend for transactional emails
- **File Storage**: AWS S3 for photo uploads

### Database
- **Primary Database**: PostgreSQL (Neon)
- **Caching**: PostgreSQL-based caching system
- **Connection Pooling**: Enabled via Neon

### Testing & Quality
- **Unit Testing**: Jest
- **E2E Testing**: Playwright
- **Linting**: ESLint with Next.js config
- **Type Safety**: TypeScript

### Deployment
- **Platform**: Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics

## 📁 Project Structure

```
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── scripts/               # Utility scripts for development and deployment
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API route handlers
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── customer/      # Customer dashboard pages
│   │   ├── employee/      # Employee dashboard pages
│   │   └── auth/          # Authentication pages
│   ├── components/        # React components
│   │   ├── ui/            # UI components (buttons, cards, etc.)
│   │   ├── forms/         # Form components
│   │   └── shared/        # Shared components across roles
│   ├── lib/               # Utility functions and services
│   ├── hooks/             # Custom React hooks
│   ├── middleware/        # Next.js middleware
│   └── types/             # TypeScript type definitions
├── tests/                 # Test files and mocks
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
└── docs/                  # Documentation files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git
- PostgreSQL database (or Neon account)
- Stripe account for payment processing
- Google Maps API key for location services
- AWS account for S3 storage (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/scoopify-club.git
   cd scoopify-club
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Setup

1. Copy the example environment files:
   ```bash
   cp .env.example .env
   cp .env.local.example .env.local
   ```

2. Update the environment variables in `.env.local` with your API keys and credentials:

#### Required Environment Variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random string for session encryption
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API key

3. Set up your database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. Seed the database with initial data:
   ```bash
   npx prisma db seed
   ```

### Running Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. For secure local development with HTTPS:
   ```bash
   npm run dev:secure
   ```

3. Access the application at http://localhost:3000 (or https://localhost:3000 for secure mode)

## 🗄️ Database Configuration

ScoopifyClub uses PostgreSQL through Neon, a serverless Postgres provider. Our schema is defined in Prisma and includes models for:

- Users, Customers, and Employees
- Subscriptions and Service Plans
- Services and Service Photos
- Payments and Earnings
- Referrals and Notifications

### Schema Management

The database schema is managed through Prisma. Key files:
- `prisma/schema.prisma`: Database schema definition
- `prisma/seed.ts`: Initial data seeding

### Database Connection

For optimal performance, we use connection pooling through Neon:
```
DATABASE_URL="postgres://user:password@db.neon.tech/neondb?pgbouncer=true&connect_timeout=10"
```

## 🔐 Authentication System

ScoopifyClub implements a custom JWT-based authentication system:

1. **Login/Registration**: Email and password authentication
2. **Session Management**: JWT with refresh tokens
3. **Role-Based Access**: Different routes for customers, employees, and admins
4. **Security Features**:
   - CSRF protection
   - HTTP-only cookies
   - Token refresh mechanism
   - Device fingerprinting for multi-device support

Authentication flow is managed through middleware and API routes in the `src/app/api/auth` directory.

## 💳 Payment System

### Subscription Plans

- **Weekly**: Regular weekly service
- **Bi-weekly**: Service every two weeks
- **One-time**: Single service booking

### Payment Processing

1. **Customer Payments**:
   - Automatic billing through Stripe
   - Service-based one-time charges
   - Subscription management and proration

2. **Employee Payments**:
   - Earnings calculated per service (75% of service value after fees)
   - Batch processing for efficiency
   - Multiple payout methods (Stripe, Cash App)

3. **Referral System**:
   - $5 monthly payment for each active referred customer
   - Automatic tracking and processing

### Payment Flow

```
Customer payment → Stripe fees deducted → Referral fees → Employee share (75%) → Company share (25%)
```

## 🧪 Testing

### Unit and Integration Tests

Run unit and integration tests with Jest:
```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

### E2E Testing

End-to-end tests are implemented with Playwright:

1. Set up the test environment:
   ```bash
   npm run test:e2e:setup
   ```

2. Run all E2E tests:
   ```bash
   npm run test:e2e
   ```

3. Run tests with UI mode:
   ```bash
   npm run test:e2e:ui
   ```

4. View test report:
   ```bash
   npm run test:e2e:report
   ```

## 🚢 Deployment

### Vercel Deployment

ScoopifyClub is optimized for deployment on Vercel:

1. Prepare your PostgreSQL migrations:
   ```bash
   npm run prepare:vercel
   ```

2. Set up environment variables:
   ```bash
   npm run setup:vercel
   ```

3. Deploy to Vercel:
   ```bash
   npm run vercel:production
   ```

### Environment Variables for Production

For production deployment, ensure these variables are set in Vercel:

- `DATABASE_URL`: Production PostgreSQL connection string
- `DATABASE_PROVIDER`: Set to "postgresql"
- `NEXTAUTH_URL`: Your production domain
- `NEXTAUTH_SECRET`: Strong random string
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`: Production Stripe keys
- All other API keys and secrets from your `.env.production` file

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

## 📚 API Documentation

API routes are documented with appropriate JSDoc comments and follow RESTful design principles. Key endpoints include:

- **Authentication**: `/api/auth/*`
- **Customer Services**: `/api/customer/*`
- **Employee Management**: `/api/employee/*`
- **Admin Operations**: `/api/admin/*`
- **Payment Processing**: `/api/payments/*`
- **Stripe Webhooks**: `/api/webhooks/stripe`
- **Cron Jobs**: `/api/cron/*`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## ❓ Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check your DATABASE_URL format
   - Ensure network connectivity to your database
   - Verify PostgreSQL credentials

2. **Authentication Issues**:
   - Check JWT_SECRET is properly set
   - Ensure cookies are being properly stored
   - Verify NEXTAUTH_URL matches your domain

3. **Stripe Integration Problems**:
   - Confirm Stripe API keys are correct
   - Check webhook configuration
   - Ensure test mode vs live mode consistency

### Getting Help

If you encounter issues not covered here, please:
1. Check existing GitHub issues
2. Review the error logs in your console
3. Create a new issue with detailed reproduction steps

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

© 2024 ScoopifyClub. All Rights Reserved. 