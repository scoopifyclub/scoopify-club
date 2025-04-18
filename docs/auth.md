# Authentication System Documentation

## Overview
The authentication system provides secure user authentication and session management for the ScoopifyClub application. It uses JWT tokens for stateless authentication and includes features like rate limiting, token refresh, and role-based access control.

## Security Features

### Token-based Authentication
- **Access Tokens**: Short-lived (15 minutes) JWT tokens containing user identity and role
- **Refresh Tokens**: Long-lived (7 days) tokens used to obtain new access tokens
- **Secure Storage**: Refresh tokens are stored in the database, access tokens in memory
- **Token Invalidation**: Automatic invalidation on logout and password changes

### Rate Limiting
- Prevents brute force attacks
- Limits login attempts to 5 per minute per IP
- Applies to both login and token refresh endpoints

### Password Security
- Bcrypt hashing with 12 rounds
- Minimum password requirements:
  - 8 characters minimum
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

## API Endpoints

### Login (`POST /api/auth/login`)
```typescript
Request:
{
  email: string;
  password: string;
}

Response:
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
  }
}
```

### Token Refresh (`POST /api/auth/refresh`)
```typescript
Request:
{
  refreshToken: string;
}

Response:
{
  accessToken: string;
}
```

### Logout (`POST /api/auth/logout`)
```typescript
Request:
{
  refreshToken: string;
}

Response:
{
  success: boolean;
}
```

## Implementation Details

### Token Structure
```typescript
// Access Token Payload
{
  id: string;          // User ID
  email: string;       // User email
  role: string;        // User role
  customerId?: string; // Optional customer ID
  employeeId?: string; // Optional employee ID
  iat: number;         // Issued at timestamp
  exp: number;         // Expiration timestamp
}

// Refresh Token Payload
{
  id: string;          // User ID
  iat: number;         // Issued at timestamp
  exp: number;         // Expiration timestamp
}
```

### Security Headers
The system implements the following security headers:
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,DELETE,PATCH,POST,PUT`
- `Access-Control-Allow-Headers: X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version`

## Usage in API Routes

### Authentication Middleware
```typescript
import { requireAuth } from '@/lib/api-auth'

// Basic authentication check
const user = await requireAuth(request)

// Role-based access control
const user = await requireAuth(request, 'ADMIN')
```

### Error Handling
The system throws specific error types:
- `UnauthorizedError`: Invalid or missing authentication
- `ForbiddenError`: Insufficient permissions
- `RateLimitError`: Too many requests
- `ValidationError`: Invalid input data

## Testing
The authentication system includes comprehensive tests covering:
1. User creation and cleanup
2. Login functionality
3. Token verification
4. Token refresh mechanism
5. Rate limiting
6. Logout functionality

To run tests:
```bash
node test/auth/test.js
```

## Best Practices

### Client-side Implementation
1. Store access token in memory only
2. Store refresh token in secure HTTP-only cookie
3. Implement automatic token refresh before expiration
4. Handle token expiration gracefully

### Server-side Implementation
1. Always verify tokens using `verifyToken`
2. Use `requireAuth` middleware for protected routes
3. Implement role-based access control where needed
4. Log authentication failures for security monitoring

## Security Considerations

### Token Security
- Access tokens are short-lived to minimize impact of token theft
- Refresh tokens are stored securely in the database
- Tokens are invalidated on logout and password changes

### Rate Limiting
- Prevents brute force attacks
- Protects against denial of service
- Configurable limits based on security requirements

### Password Security
- Strong password requirements
- Secure password hashing
- No plaintext password storage
- Password change requires current password

## Troubleshooting

### Common Issues
1. **Token Expiration**
   - Solution: Implement token refresh mechanism
   - Check token expiration before making requests

2. **Rate Limiting**
   - Solution: Implement exponential backoff
   - Show user-friendly error messages

3. **Authentication Failures**
   - Check token validity
   - Verify user role permissions
   - Ensure proper error handling

### Error Codes
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 429: Too Many Requests (rate limit exceeded)
- 400: Bad Request (invalid input) 