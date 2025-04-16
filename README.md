# ScoopifyClub

A web application for managing pet waste removal services.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Prisma (ORM)
- SQLite (Development) / PostgreSQL (Production)
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

3. Create a `.env` file in the root directory with the following content:
```env
# App URL (development)
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key"

# JWT
JWT_SECRET="your-jwt-secret"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# Stripe
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
```

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