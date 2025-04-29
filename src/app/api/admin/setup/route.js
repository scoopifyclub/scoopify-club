import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import bcrypt from 'bcryptjs';
export async function POST() {
    try {
        // Check if admin user already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: 'admin@scoopify.com' }
        });
        if (existingAdmin) {
            return NextResponse.json({ message: 'Admin user already exists' });
        }
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 12);
        const admin = await prisma.user.create({
            data: {
                email: 'admin@scoopify.com',
                name: 'Admin User',
                password: hashedPassword,
                role: 'ADMIN',
                emailVerified: true
            }
        });
        return NextResponse.json({
            message: 'Admin user created successfully',
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            }
        });
    }
    catch (error) {
        console.error('Setup error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
