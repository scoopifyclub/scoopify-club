export const swaggerConfig = {
    openapi: '3.0.0',
    info: {
        title: 'Scoopify Club API',
        version: '1.0.0',
        description: 'API documentation for Scoopify Club services',
    },
    servers: [
        {
            url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
            description: 'API server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        description: 'Error message',
                    },
                    details: {
                        type: 'object',
                        description: 'Additional error details',
                    },
                },
            },
            Service: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                    },
                    status: {
                        type: 'string',
                        enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
                    },
                    scheduledDate: {
                        type: 'string',
                        format: 'date-time',
                    },
                    servicePlan: {
                        $ref: '#/components/schemas/ServicePlan',
                    },
                    employee: {
                        $ref: '#/components/schemas/Employee',
                    },
                },
            },
            ServicePlan: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                    },
                    price: {
                        type: 'number',
                        format: 'float',
                    },
                    duration: {
                        type: 'number',
                        description: 'Duration in minutes',
                    },
                },
            },
            Employee: {
                type: 'object',
                properties: {
                    user: {
                        $ref: '#/components/schemas/User',
                    },
                },
            },
            User: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                    },
                    image: {
                        type: 'string',
                        format: 'uri',
                    },
                },
            },
            Payment: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                    },
                    amount: {
                        type: 'number',
                        format: 'float',
                    },
                    status: {
                        type: 'string',
                        enum: ['PENDING', 'COMPLETED', 'FAILED'],
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                    },
                    service: {
                        $ref: '#/components/schemas/Service',
                    },
                },
            },
        },
    },
    paths: {
        '/api/customer/services': {
            get: {
                summary: 'Get customer services',
                description: 'Retrieve a list of services for the authenticated customer',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        description: 'Page number',
                        schema: { type: 'integer', default: 1 },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        description: 'Number of items per page',
                        schema: { type: 'integer', default: 10 },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Service',
                                    },
                                },
                            },
                        },
                    },
                    '401': {
                        description: 'Unauthorized',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                    '429': {
                        description: 'Too many requests',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                },
            },
            post: {
                summary: 'Create a new service',
                description: 'Create a new service for the authenticated customer',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['servicePlanId', 'scheduledDate', 'locationId'],
                                properties: {
                                    servicePlanId: {
                                        type: 'string',
                                        format: 'uuid',
                                    },
                                    scheduledDate: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    locationId: {
                                        type: 'string',
                                        format: 'uuid',
                                    },
                                    notes: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Service created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Service',
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Invalid input',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                    '401': {
                        description: 'Unauthorized',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                    '429': {
                        description: 'Too many requests',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/api/customer/payments': {
            get: {
                summary: 'Get customer payments',
                description: 'Retrieve a list of payments for the authenticated customer',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        description: 'Page number',
                        schema: { type: 'integer', default: 1 },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        description: 'Number of items per page',
                        schema: { type: 'integer', default: 10 },
                    },
                    {
                        name: 'status',
                        in: 'query',
                        description: 'Filter by payment status',
                        schema: {
                            type: 'string',
                            enum: ['PENDING', 'COMPLETED', 'FAILED'],
                        },
                    },
                    {
                        name: 'startDate',
                        in: 'query',
                        description: 'Filter by start date',
                        schema: { type: 'string', format: 'date-time' },
                    },
                    {
                        name: 'endDate',
                        in: 'query',
                        description: 'Filter by end date',
                        schema: { type: 'string', format: 'date-time' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        payments: {
                                            type: 'array',
                                            items: {
                                                $ref: '#/components/schemas/Payment',
                                            },
                                        },
                                        pagination: {
                                            type: 'object',
                                            properties: {
                                                total: { type: 'integer' },
                                                page: { type: 'integer' },
                                                limit: { type: 'integer' },
                                                totalPages: { type: 'integer' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '401': {
                        description: 'Unauthorized',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                    '429': {
                        description: 'Too many requests',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                },
            },
            post: {
                summary: 'Create a new payment',
                description: 'Create a new payment for the authenticated customer',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['amount', 'serviceId', 'paymentMethodId'],
                                properties: {
                                    amount: {
                                        type: 'number',
                                        format: 'float',
                                    },
                                    serviceId: {
                                        type: 'string',
                                        format: 'uuid',
                                    },
                                    paymentMethodId: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Payment created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Payment',
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Invalid input',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                    '401': {
                        description: 'Unauthorized',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                    '429': {
                        description: 'Too many requests',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Error',
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
