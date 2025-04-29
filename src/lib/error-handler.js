import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';
// Define common error codes
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["TOO_MANY_REQUESTS"] = "TOO_MANY_REQUESTS";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
})(ErrorCode || (ErrorCode = {}));
// Map error codes to HTTP status codes
const STATUS_CODE_MAP = {
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.BAD_REQUEST]: 400,
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.CONFLICT]: 409,
    [ErrorCode.TOO_MANY_REQUESTS]: 429,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503
};
// API error class for standardized error handling
export class ApiError extends Error {
    constructor(message, code = ErrorCode.INTERNAL_ERROR, details) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.statusCode = STATUS_CODE_MAP[code];
        this.details = details;
    }
}
// A handler to wrap API route handlers for consistent error handling
export function withErrorHandler(handler) {
    return async (request, ...args) => {
        try {
            return await handler(request, ...args);
        }
        catch (error) {
            return handleError(error, request);
        }
    };
}
// Function to handle errors and return appropriate response
export function handleError(error, request) {
    // Get request path for logging
    const url = new URL(request.url);
    const path = url.pathname;
    // Create a timestamp
    const timestamp = new Date().toISOString();
    if (error instanceof ApiError) {
        // Log API errors based on severity
        if (error.statusCode >= 500) {
            logger.error(`API Error [${error.code}]: ${error.message}`, {
                path,
                details: error.details,
                stack: error.stack
            });
        }
        else {
            logger.warn(`API Error [${error.code}]: ${error.message}`, {
                path,
                details: error.details
            });
        }
        return NextResponse.json({
            error: error.message,
            code: error.code,
            statusCode: error.statusCode,
            details: error.details,
            path,
            timestamp
        }, { status: error.statusCode });
    }
    else if (error instanceof ZodError) {
        // Handle validation errors from Zod
        logger.warn(`Validation error in ${path}`, {
            errors: error.errors
        });
        return NextResponse.json({
            error: 'Validation error',
            code: ErrorCode.VALIDATION_ERROR,
            statusCode: 400,
            details: error.errors,
            path,
            timestamp
        }, { status: 400 });
    }
    else {
        // Handle unknown errors
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        const stack = error instanceof Error ? error.stack : undefined;
        // Always log unknown errors as they might be serious
        logger.error(`Unhandled exception in ${path}: ${message}`, {
            error: error instanceof Error ? error.name : 'Unknown',
            stack
        });
        // In production, don't expose error details
        const isProduction = process.env.NODE_ENV === 'production';
        return NextResponse.json({
            error: message,
            code: ErrorCode.INTERNAL_ERROR,
            statusCode: 500,
            details: isProduction ? undefined : stack,
            path,
            timestamp
        }, { status: 500 });
    }
}
