# API Documentation

## Authentication

All API endpoints require authentication unless otherwise specified. Authentication is handled via NextAuth.js with JWT tokens.

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Endpoints

### Admin Endpoints

#### Service Management
- `GET /api/admin/services/overview`
  - Returns service statistics
  - Response:
    ```json
    {
      "today": 5,
      "upcoming": 12,
      "completed": 45,
      "pending": 8
    }
    ```

#### Employee Management
- `GET /api/admin/employees`
  - Returns list of employees
  - Response:
    ```json
    [
      {
        "id": "emp_123",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "555-123-4567"
      }
    ]
    ```

- `GET /api/admin/employees/[employeeId]/metrics`
  - Returns employee performance metrics
  - Response:
    ```json
    {
      "totalServices": 50,
      "completedServices": 45,
      "averageTime": 30,
      "timeExtensions": 5,
      "cancellations": 2
    }
    ```

#### Service Area Management
- `POST /api/admin/employees/[employeeId]/service-areas`
  - Creates a new service area
  - Request:
    ```json
    {
      "zipCode": "12345",
      "radius": 10,
      "isPrimary": true
    }
    ```
  - Response:
    ```json
    {
      "id": "area_123",
      "zipCode": "12345",
      "radius": 10,
      "isPrimary": true
    }
    ```

### Employee Endpoints

#### Service Management
- `GET /api/employee/services`
  - Returns employee's services
  - Query Parameters:
    - `startDate`: YYYY-MM-DD
    - `endDate`: YYYY-MM-DD
  - Response:
    ```json
    [
      {
        "id": "svc_123",
        "customerName": "Jane Smith",
        "address": "123 Main St, City, State 12345",
        "scheduledDate": "2024-03-20T14:00:00Z",
        "status": "PENDING"
      }
    ]
    ```

#### Time Extensions
- `POST /api/employee/services/[serviceId]/extend-time`
  - Request:
    ```json
    {
      "minutes": 15
    }
    ```
  - Response:
    ```json
    {
      "id": "ext_123",
      "serviceId": "svc_123",
      "minutes": 15,
      "createdAt": "2024-03-20T13:45:00Z"
    }
    ```

### Service Endpoints

#### Service Matching
- `POST /api/services/match`
  - Matches services with available employees
  - Request:
    ```json
    {
      "serviceId": "svc_123"
    }
    ```
  - Response:
    ```json
    {
      "matches": [
        {
          "id": "emp_123",
          "name": "John Doe",
          "distance": 2.5
        }
      ],
      "customerZip": "12345",
      "totalMatches": 1
    }
    ```

#### Weather Delays
- `POST /api/services/weather-delay`
  - Handles weather-related service delays
  - Request:
    ```json
    {
      "serviceId": "svc_123"
    }
    ```
  - Response:
    ```json
    {
      "success": true
    }
    ```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message",
  "status": 400
}
```

Common HTTP Status Codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Pagination

Endpoints that return lists support pagination:
- `limit`: Number of items per page (default: 10)
- `offset`: Number of items to skip

Example:
```
GET /api/employee/services?limit=20&offset=40
```

## Webhooks

The system supports webhooks for real-time updates:

### Service Status Updates
- URL: `/api/webhooks/service-status`
- Events:
  - `service.created`
  - `service.updated`
  - `service.completed`
  - `service.cancelled`

### Employee Updates
- URL: `/api/webhooks/employee-status`
- Events:
  - `employee.created`
  - `employee.updated`
  - `employee.deactivated` 