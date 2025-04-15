# Contributing to Scoopify Club

Thank you for your interest in contributing to Scoopify Club! This document provides guidelines and instructions for contributing to the project.

## Development Workflow

1. **Fork the Repository**
   - Fork the main repository to your GitHub account
   - Clone your fork locally
   ```bash
   git clone https://github.com/yourusername/scoopify-club.git
   cd scoopify-club
   ```

2. **Set Up Development Environment**
   - Install dependencies:
     ```bash
     npm install
     ```
   - Set up environment variables (see `.env.example`)
   - Initialize the database:
     ```bash
     npx prisma generate
     npx prisma migrate dev
     ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Changes**
   - Follow the coding standards
   - Write tests for new features
   - Update documentation as needed

5. **Commit Changes**
   - Use conventional commit messages
   - Keep commits focused and atomic
   ```bash
   git commit -m "feat: add new feature"
   ```

6. **Push Changes**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create Pull Request**
   - Open a PR against the main repository
   - Include a detailed description
   - Reference any related issues

## Coding Standards

### TypeScript
- Use strict type checking
- Avoid `any` type
- Use interfaces for object shapes
- Document complex types

### React/Next.js
- Use functional components
- Implement proper error boundaries
- Follow React hooks rules
- Use proper state management

### Database
- Follow Prisma best practices
- Use migrations for schema changes
- Document complex queries
- Implement proper indexing

### API Design
- Follow RESTful principles
- Use proper HTTP methods
- Implement proper error handling
- Document endpoints

## Testing

1. **Unit Tests**
   - Write tests for utility functions
   - Test component rendering
   - Test API endpoints

2. **Integration Tests**
   - Test database operations
   - Test API flows
   - Test authentication

3. **Running Tests**
   ```bash
   npm test        # Run all tests
   npm test:watch  # Run tests in watch mode
   ```

## Documentation

1. **Code Documentation**
   - Document complex functions
   - Add JSDoc comments
   - Keep README updated

2. **API Documentation**
   - Document endpoints
   - Include request/response examples
   - Document error cases

## Security

1. **Authentication**
   - Use proper session management
   - Implement role-based access
   - Secure sensitive data

2. **Data Protection**
   - Encrypt sensitive data
   - Use proper validation
   - Implement rate limiting

## Review Process

1. **Code Review**
   - Reviewers will check for:
     - Code quality
     - Security concerns
     - Performance impact
     - Documentation

2. **Testing**
   - All tests must pass
   - New features need tests
   - No regression in existing features

3. **Documentation**
   - README updates
   - API documentation
   - Code comments

## Getting Help

- Open an issue for bugs
- Use discussions for questions
- Contact maintainers for urgent matters

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License. 