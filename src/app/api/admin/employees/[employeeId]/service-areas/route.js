import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
export async function POST(request, { params }) {
    var _a;
    try {
        // Extract the employeeId from params
        const { employeeId } = await params;
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        try {
            const userData = await validateUser(accessToken);
            if (userData.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Unauthorized, admin access required' }, { status: 401 });
            }
        }
        catch (err) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
        const { zipCode } = await request.json();
        // Validate zip code format
        if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
            return NextResponse.json({ error: 'Invalid zip code format' }, { status: 400 });
        }
        // Create service area
        const serviceArea = await prisma.serviceArea.create({
            data: {
                employeeId,
                zipCode
            },
        });
        return NextResponse.json(serviceArea);
    }
    catch (error) {
        console.error('Error creating service area:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function GET(request, { params }) {
    var _a;
    try {
        // Extract the employeeId from params
        const { employeeId } = await params;
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        try {
            const userData = await validateUser(accessToken);
            if (userData.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Unauthorized, admin access required' }, { status: 401 });
            }
        }
        catch (err) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
        const serviceAreas = await prisma.serviceArea.findMany({
            where: { employeeId },
        });
        return NextResponse.json(serviceAreas);
    }
    catch (error) {
        console.error('Error fetching service areas:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
