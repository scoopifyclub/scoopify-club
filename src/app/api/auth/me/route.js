import { getSession } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log('🔍 /api/auth/me called');
    
    const session = await getSession(request);
    console.log('📋 Session result:', session);
    
    if (!session || !session.user) {
      console.log('❌ No session or user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', session.user);
    
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      }
    });
  } catch (error) {
    console.error('❌ Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 