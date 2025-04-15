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

# Other API keys as needed
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
```

## Current Issues

1. Database connection issues with PostgreSQL
2. Login tests failing due to authentication flow
3. Rate limiting needs Redis in production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 