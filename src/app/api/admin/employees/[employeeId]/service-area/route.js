import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
export async function PATCH(request, context) {
    var _a;
    try {
        // Extract the employeeId from params
        const { employeeId } = context.params;
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
        // Parse request body
        const { zipCode } = await request.json();
        // Validate zip code format (basic validation)
        if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
            return NextResponse.json({ error: 'Invalid zip code format' }, { status: 400 });
        }
        // Check if service area already exists
        const existingServiceArea = await prisma.serviceArea.findFirst({
            where: {
                employeeId,
                zipCode
            }
        });
        let result;
        if (existingServiceArea) {
            // Update existing service area
            result = await prisma.serviceArea.update({
                where: { id: existingServiceArea.id },
                data: { zipCode }
            });
        }
        else {
            // Create new service area
            result = await prisma.serviceArea.create({
                data: {
                    employeeId,
                    zipCode
                }
            });
        }
        return NextResponse.json(result);
    }
    catch (error) {
        console.error('Error updating employee service area:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
