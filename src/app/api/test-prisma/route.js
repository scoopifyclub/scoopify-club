import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🧪 Testing prisma import...');
    console.log('🔍 Prisma type:', typeof prisma);
    console.log('🔍 Prisma exists:', !!prisma);
    
    if (!prisma) {
      return NextResponse.json({ 
        error: 'Prisma is undefined',
        type: typeof prisma 
      }, { status: 500 });
    }
    
    if (!prisma.user) {
      return NextResponse.json({ 
        error: 'Prisma.user is undefined',
        prismaKeys: Object.keys(prisma)
      }, { status: 500 });
    }
    
    // Simple test query
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      success: true,
      userCount,
      prismaType: typeof prisma
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 