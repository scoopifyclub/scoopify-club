import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export async function requestValidator(
  request: NextRequest
): Promise<NextResponse | null> {
  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    try {
      // Validate JSON body
      const body = await request.json();
      if (!body || typeof body !== 'object') {
        throw new ValidationError('Request body must be a valid JSON object');
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
  }

  // Validate required headers
  const requiredHeaders = ['x-request-id'];
  for (const header of requiredHeaders) {
    if (!request.headers.get(header)) {
      return NextResponse.json(
        { error: `Missing required header: ${header}` },
        { status: 400 }
      );
    }
  }

  return null;
} 