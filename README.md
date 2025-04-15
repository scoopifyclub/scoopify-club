# Scoopify Club - Dog Waste Management System

A comprehensive system for managing dog waste removal services, employee scheduling, and customer subscriptions.

## Features

- **Service Management**
  - Schedule and track services
  - Handle time extensions and cancellations
  - Photo documentation of services
  - Weather delay notifications

- **Employee Management**
  - Multiple service areas per employee
  - Dynamic service area matching
  - Performance tracking
  - Time extension history

- **Customer Management**
  - Subscription management
  - Service scheduling
  - Communication system

- **Admin Dashboard**
  - Service overview
  - Employee performance metrics
  - Analytics and reporting
  - Email communication

## Prerequisites

- Node.js 18+
- PostgreSQL
- AWS Account (for S3 storage)
- Resend Account (for email)
- Stripe Account (for payments)

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/scoopify-club.git
   cd scoopify-club
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables
   - Generate a secure NEXTAUTH_SECRET:
     ```bash
     openssl rand -base64 32
     ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **AWS S3 Setup**
   - Create an S3 bucket
   - Configure CORS policy
   - Set up IAM user with S3 access
   - Add credentials to `.env`

6. **Email Setup**
   - Create a Resend account
   - Verify your domain
   - Add API key to `.env`

7. **Stripe Setup** (for future implementation)
   - Create a Stripe account
   - Add API keys to `.env`

## Development

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Database Management**
   - Generate Prisma client:
     ```bash
     npx prisma generate
     ```
   - Create migrations:
     ```bash
     npx prisma migrate dev
     ```
   - View database:
     ```bash
     npx prisma studio
     ```

## System Architecture

### Database Schema
- Users (Admin, Customer, Employee)
- Customers (with addresses)
- Employees (with service areas)
- Services (with photos and checklists)
- Subscriptions
- Payments
- Time Extensions

### API Endpoints
- `/api/admin/*` - Admin operations
- `/api/employee/*` - Employee operations
- `/api/services/*` - Service management
- `/api/customers/*` - Customer operations

### Security
- Role-based access control
- Authentication via NextAuth.js
- Input validation
- Privacy protection for employee addresses

## Deployment

1. **Production Environment**
   - Set up production database
   - Configure production environment variables
   - Set up SSL certificates
   - Configure domain settings

2. **CI/CD Pipeline**
   - Automated testing
   - Database migrations
   - Environment variable management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For support, email support@scoopify.club or create an issue in the repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 