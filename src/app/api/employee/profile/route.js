import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma.js';
import { verifyToken } from '@/lib/api-auth';

// GET handler to fetch employee profile data
export async function GET(request) {
    try {
        console.log('📊 Fetching employee profile data...');
        
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

        console.log('👤 Looking up user with ID:', decoded.userId);
        
        // Get user data
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        if (!user || user.role !== 'EMPLOYEE') {
            console.log('❌ Unauthorized - user:', user);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get employee data
        let employee = null;
        try {
            employee = await prisma.employee.findUnique({
                where: { userId: user.id },
                select: {
                    id: true,
                    phone: true,
                    status: true,
                    cashAppUsername: true,
                    preferredPaymentMethod: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
        } catch (error) {
            console.log('❌ Error fetching employee data:', error.message);
        }

        // Return combined profile data
        const profileData = {
            name: user.name,
            email: user.email,
            phone: employee?.phone || '',
            address: '', // We'll need to add address to employee table or get from signup
            bio: '', // We'll need to add bio to employee table
            createdAt: employee?.createdAt || user.createdAt,
            status: employee?.status || 'ACTIVE',
            payment: {
                method: employee?.preferredPaymentMethod || '',
                cashAppUsername: employee?.cashAppUsername || '',
                stripeEmail: user.email, // Default to user email for Stripe
                frequency: 'weekly', // Default frequency
                minimumPayout: 50 // Default minimum payout
            }
        };

        console.log('✅ Profile data retrieved:', profileData);
        
        return NextResponse.json(profileData);
    }
    catch (error) {
        console.error('❌ Profile API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT handler to update employee profile
export async function PUT(request) {
    try {
        const user = await requireRole('EMPLOYEE');
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await request.json();
        const { name, email, phone } = data;

        const employee = await prisma.employee.update({
            where: { userId: user.id },
            data: {
                user: {
                    update: {
                        name,
                        email,
                    },
                },
                phone,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return NextResponse.json(employee);
    }
    catch (error) {
        console.error('Error updating employee profile:', error);
        return NextResponse.json(
            { error: 'Failed to update employee profile' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        console.log('💾 Updating employee profile...');
        
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
        const { name, phone, bio } = body;

        // Update user name if provided
        if (name) {
            await prisma.user.update({
                where: { id: decoded.userId },
                data: { name }
            });
        }

        // Update employee data if provided
        if (phone || bio) {
            await prisma.employee.update({
                where: { userId: decoded.userId },
                data: {
                    ...(phone && { phone }),
                    updatedAt: new Date()
                }
            });
        }

        console.log('✅ Profile updated successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Profile update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
