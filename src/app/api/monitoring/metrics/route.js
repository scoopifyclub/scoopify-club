import { monitoring } from '@/lib/monitoring';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const type = searchParams.get('type') || 'all';

    let data = {};

    if (type === 'all' || type === 'performance') {
      data.performance = await monitoring.getPerformanceMetrics(limit);
    }

    if (type === 'all' || type === 'errors') {
      data.errors = await monitoring.getErrorLogs(limit);
    }

    if (type === 'all' || type === 'stats') {
      data.stats = await monitoring.getSystemStats();
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      data
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to get metrics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { metric, value, metadata } = body;

    if (!metric || value === undefined) {
      return NextResponse.json(
        { status: 'error', message: 'Metric and value are required' },
        { status: 400 }
      );
    }

    await monitoring.trackBusinessMetric(metric, value, metadata);

    return NextResponse.json({
      status: 'ok',
      message: 'Metric tracked successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to track metric:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to track metric',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 