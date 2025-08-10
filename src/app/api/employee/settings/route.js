import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';
import { verifyToken } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function POST(request) {
  try {
    console.log('💾 Saving employee settings...');
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;
    if (!token) {
      console.log('❌ No token found in cookies');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and get user
    const decoded = await verifyToken(token);
    if (!decoded) {
      console.log('❌ Token verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { section, data } = body;

    console.log('📝 Saving settings section:', section);

    switch (section) {
      case 'profile':
        // Update user name and email
        if (data.name || data.email) {
          await prisma.user.update({
            where: { id: decoded.userId },
            data: {
              ...(data.name && { name: data.name }),
              ...(data.email && { email: data.email }),
              updatedAt: new Date()
            }
          });
        }

        // Update employee phone
        if (data.phone) {
          await prisma.employee.update({
            where: { userId: decoded.userId },
            data: {
              phone: data.phone,
              updatedAt: new Date()
            }
          });
        }
        break;

      case 'notifications':
        // For now, just log the notification preferences
        // In a real app, you'd save these to a settings table
        console.log('📱 Notification settings:', data);
        break;

      case 'workPreferences':
        // For now, just log the work preferences
        // In a real app, you'd save these to the employee table or settings table
        console.log('⏰ Work preferences:', data);
        break;

      case 'payment':
        // Save payment settings to Employee table
        const paymentUpdateData = {};
        
        if (data.method) {
          paymentUpdateData.preferredPaymentMethod = data.method;
        }
        
        if (data.cashAppUsername && data.method === 'CASH_APP') {
          paymentUpdateData.cashAppUsername = data.cashAppUsername;
        }
        
        if (Object.keys(paymentUpdateData).length > 0) {
          paymentUpdateData.updatedAt = new Date();
          
          await prisma.employee.update({
            where: { userId: decoded.userId },
            data: paymentUpdateData
          });
          
          console.log('💳 Payment settings saved:', paymentUpdateData);
        } else {
          console.log('💳 No payment data to save');
        }
        break;

      case 'privacy':
        // For now, just log the privacy settings
        // In a real app, you'd save these to a privacy settings table
        console.log('🔒 Privacy settings:', data);
        break;

      default:
        console.log('❓ Unknown settings section:', section);
        return NextResponse.json({ error: 'Unknown settings section' }, { status: 400 });
    }

    console.log('✅ Settings saved successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Settings save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 