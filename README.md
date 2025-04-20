# ScoopifyClub

A web application for managing pet waste removal services.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma (ORM)
- PostgreSQL (Neon)
- TailwindCSS
- NextAuth.js
- Stripe Integration
- Playwright (Testing)

## Features

### Authentication
- Role-based access control (Admin, Customer, Employee)
- Secure password reset flow
- Email verification
- Session management
- Cookie-based authentication

### Error Handling
- Global error boundary
- Component-level error boundaries
- Consistent error messages
- Error recovery options

### Loading States
- Page loading indicators
- Data loading states
- Skeleton loading
- Progress indicators

### Testing
- Unit tests
- Integration tests
- E2E tests with Playwright
- Test helpers and mocks
- Database seeding

## Referral System and Payment Distribution

### Customer Referrals
- Each customer has a unique referral code generated automatically
- Customers can share their referral code with friends through direct sharing or copy-paste
- When new users sign up using a referral code, the referrer is automatically linked
- Referrers earn $5 per month for each active customer they refer
- Referral earnings are tracked and displayed in the customer dashboard
- Referral payments are only processed after a subscription payment is made
- Any fees for sending the $5 referral payment are borne by the recipient
- Monthly payments are processed automatically via the payment batch system

### Service Scheduling
- Customers select their preferred service day (Monday-Sunday) during signup
- Customers can modify their preferred day in their dashboard settings
- Services are automatically scheduled based on the customer's preferred day
- If a service is not claimed by an employee by the end of the day, it's automatically rescheduled

### Payment Distribution
The payment flow follows this distribution model:
1. Stripe processing fees are deducted first (typically 2.9% + $0.30)
2. Referral fees ($5 per referral) are deducted from the top
3. Employee scoopers receive 75% of the remaining amount
4. The company keeps 25% of the remaining amount

Example calculation:
```
Customer payment: $100.00
- Stripe fee: -$3.20 (2.9% + $0.30)
- Referral fee: -$5.00
= Remaining amount: $91.80
  - Employee share: $68.85 (75%)
  - Company share: $22.95 (25%)
```

### Payment Batch System
- Administrators can manage employee and referral payments in batches
- Batches can be created, reviewed, and processed together
- Batch approval workflow ensures proper oversight before payments are sent
- Multiple payment methods supported (Stripe, Cash App, Cash, Check)
- Batch status tracking (Draft, Processing, Completed, Partially Completed, Failed)
- Payment history and audit logging for all batch activities
- Failed payment handling with retry options
- Manual payment entry for special cases
- See [payment-batches.md](docs/payment-batches.md) for detailed documentation

### Employee Job Claiming
- Available jobs appear in the employee dashboard from 7am to 7pm on the scheduled day
- Jobs are sorted by proximity to the employee's current location
- Each job displays the potential earnings (75% of the service price after fees)
- Employees can claim jobs through the dashboard, which updates the status and assigns them
- Claimed jobs appear in the employee's schedule

## Getting Started

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ScoopifyClub
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment:
   - Copy `.env.example` to `.env.local`
   - Update the following variables in `.env.local`:
     - `DATABASE_URL`: Your Neon PostgreSQL connection string
     - `NEXTAUTH_SECRET`: Generate a secure secret (e.g., using `openssl rand -base64 32`)
     - `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
     - Other required environment variables as listed in `.env.example`

4. Set up your database:
   - Sign up for a free Neon PostgreSQL database at https://neon.tech
   - Create a new project and database
   - Copy the connection string from your Neon dashboard
   - Update `DATABASE_URL` in your `.env.local` file with the connection string
   - Run database migrations:
     ```bash
     npx prisma migrate dev
     ```

5. Start the development server:
```bash
npm run dev
```

## Database Configuration

The application uses Neon PostgreSQL for all environments. Key points:

- Development: Use your Neon PostgreSQL database
- Production: Use your Neon PostgreSQL database
- Testing: Use a separate Neon PostgreSQL database or local PostgreSQL instance

### Connection Pooling

The application uses Neon's built-in connection pooling. Your connection string should include:
- `pgbouncer=true` for connection pooling
- `connect_timeout=10` for connection timeout settings

### Environment Variables

See `.env.example` for all required environment variables. Key database-related variables:

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `NEON_POOL_SIZE`: Connection pool size (default: 20)
- `NEON_IDLE_TIMEOUT`: Connection idle timeout in milliseconds (default: 30000)
- `NEON_CONNECTION_TIMEOUT`: Connection timeout in milliseconds (default: 2000)

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── employee/          # Employee dashboard
│   └── dashboard/         # Customer dashboard
├── components/            # React components
│   ├── ui/               # UI components
│   ├── auth/             # Auth components
│   └── shared/           # Shared components
├── lib/                  # Utility functions
├── middleware/           # Next.js middleware
├── types/               # TypeScript types
└── tests/               # Test files
```

## Test Users

The following test users are available after running the seed script:

- Customer:
  - Email: customer@scoopify.com
  - Password: Customer123!

- Employee:
  - Email: employee@scoopify.com
  - Password: Employee123!

- Admin:
  - Email: admin@scoopify.com
  - Password: admin123

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/login.spec.ts

# Run tests in UI mode
npx playwright test --ui
```

## Error Handling

The application includes comprehensive error handling:

1. **Global Error Boundary**
   - Catches unhandled errors
   - Provides recovery options
   - Logs errors to console

2. **Component Error Boundaries**
   - Isolates component errors
   - Prevents app crashes
   - Shows fallback UI

3. **API Error Handling**
   - Consistent error responses
   - Proper status codes
   - Error logging

## Loading States

The application provides various loading states:

1. **Page Loading**
   - Full-page loading indicator
   - Progress bar
   - Skeleton loading

2. **Data Loading**
   - Inline loading indicators
   - Skeleton UI
   - Progress indicators

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Recent Updates
- Added payment batch system for efficient processing of multiple payments
- Enhanced referral payment workflow to ensure payments are only processed after subscription payments
- Improved payment audit logging with detailed tracking of all payment activities
- Added multiple payment method support for different recipient preferences
- Implemented validation to ensure proper payment approval and processing

## Current Issues

1. Database connection issues with PostgreSQL
2. Login tests failing due to authentication flow
3. Rate limiting needs Redis in production
4. Email verification flow needs implementation
5. Password strength validation needed

## Database Setup with Vercel PostgreSQL

### Local Development
1. Create a local PostgreSQL database:
   ```bash
   createdb scoopifyclub
   ```

2. Update your `.env.local` file with the local database URL:
   ```
   DATABASE_URL="postgres://default:your-password@localhost:5432/scoopifyclub"
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

### Vercel Deployment
1. In your Vercel project dashboard:
   - Go to "Storage" tab
   - Click "Create Database"
   - Select "PostgreSQL Database"
   - Choose your preferred region
   - Click "Create"

2. After creation, Vercel will automatically:
   - Add the `DATABASE_URL` to your project's environment variables
   - Configure the connection pooling
   - Set up automatic backups

3. Deploy your project:
   ```bash
   vercel deploy
   ```

4. Run production migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Environment Variables
Make sure these variables are set in your Vercel project settings:

```env
# Database
DATABASE_URL="postgres://..."  # Added automatically by Vercel

# Auth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-email-password"
SMTP_FROM="noreply@scoopify.com"
```

### Security Notes
- Never commit `.env.local` or any files containing sensitive credentials
- Use strong, unique passwords for database access
- Regularly rotate security keys and credentials
- Enable SSL/TLS for database connections in production 