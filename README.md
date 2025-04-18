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