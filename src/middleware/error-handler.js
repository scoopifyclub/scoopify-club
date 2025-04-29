import { NextResponse } from 'next/server';
export async function errorHandler(request, error) {
    // Log the error with additional context
    console.error('API Error:', {
        path: request.nextUrl.pathname,
        method: request.method,
        error: {
            message: error.message,
            code: error.code,
            stack: error.stack,
        },
        timestamp: new Date().toISOString(),
    });
    // Handle specific error types
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Duplicate record' }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Default error response
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
