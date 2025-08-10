import { NextResponse } from 'next/server';
import { withAdminDatabase } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await withAdminDatabase(async (prisma) => {
            console.log('⚙️ Fetching admin settings...');

            // Get business settings (you can expand this based on your needs)
            const businessSettings = {
                businessName: 'Scoopify Club',
                businessEmail: 'admin@scoopify.club',
                businessPhone: '(555) 123-4567',
                businessAddress: '123 Business St, Anytown, CA 94568',
                serviceArea: '50 miles',
                operatingHours: {
                    monday: '8:00 AM - 6:00 PM',
                    tuesday: '8:00 AM - 6:00 PM',
                    wednesday: '8:00 AM - 6:00 PM',
                    thursday: '8:00 AM - 6:00 PM',
                    friday: '8:00 AM - 6:00 PM',
                    saturday: '9:00 AM - 4:00 PM',
                    sunday: 'Closed'
                },
                notificationSettings: {
                    emailNotifications: true,
                    smsNotifications: true,
                    pushNotifications: true
                },
                securitySettings: {
                    twoFactorAuth: false,
                    sessionTimeout: 60, // minutes
                    maxLoginAttempts: 5
                }
            };

            return businessSettings;
        });

        return NextResponse.json(settings);

    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch settings' 
        }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Here you would typically save the settings to your database
        // For now, we'll just return success
        console.log('⚙️ Updating admin settings:', body);

        return NextResponse.json({ 
            success: true, 
            message: 'Settings updated successfully' 
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ 
            error: 'Failed to update settings' 
        }, { status: 500 });
    }
}
