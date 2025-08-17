import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateUserToken } from '@/lib/jwt-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        
        // Try to get token from various cookie names
        const token = cookieStore.get('accessToken')?.value || 
                     cookieStore.get('token')?.value || 
                     cookieStore.get('accessToken_client')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No token found' }, { status: 401 });
        }

        // Validate the token
        const userData = await validateUserToken(token);
        if (!userData) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get user profile with customer data
        const user = await prisma.user.findUnique({
            where: { id: userData.userId },
            include: {
                customer: {
                    include: {
                        address: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            customer: user.customer
        });

    } catch (error) {
        console.error('Profile error:', error);
        return NextResponse.json(
            { error: 'Failed to get profile' }, 
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const cookieStore = await cookies();
        
        // Try to get token from various cookie names
        const token = cookieStore.get('accessToken')?.value || 
                     cookieStore.get('token')?.value || 
                     cookieStore.get('accessToken_client')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No token found' }, { status: 401 });
        }

        // Validate the token
        const userData = await validateUserToken(token);
        if (!userData) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, phone, gateCode, serviceDay, address, cashAppName } = body;

        // Update user and customer in a transaction
        const updatedUser = await prisma.$transaction(async (tx) => {
            // Update user
            const user = await tx.user.update({
                where: { id: userData.userId },
                data: { name, email }
            });

            // Update customer
            const customer = await tx.customer.update({
                where: { userId: userData.userId },
                data: {
                    phone,
                    gateCode,
                    serviceDay,
                    cashAppName,
                    ...(address && {
                        address: {
                            upsert: {
                                where: { customerId: user.customer.id },
                                create: { ...address, customerId: user.customer.id },
                                update: address
                            }
                        }
                    })
                },
                include: {
                    address: true,
                    user: {
                        select: {
                            email: true,
                            name: true
                        }
                    }
                }
            });

            return { user, customer };
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' }, 
            { status: 500 }
        );
    }
}
