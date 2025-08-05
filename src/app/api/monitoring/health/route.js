import { monitoring } from '@/lib/monitoring';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const health = await monitoring.healthCheck();
    const stats = await monitoring.getSystemStats();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      health,
      stats
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 