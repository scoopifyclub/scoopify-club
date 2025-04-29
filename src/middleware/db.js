import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
export async function withDatabase(handler) {
    return async (req, ...args) => {
        try {
            // Ensure the database connection is established
            await prisma.$connect();
            // Execute the handler
            const response = await handler(req, ...args);
            // Disconnect from the database
            await prisma.$disconnect();
            return response;
        }
        catch (error) {
            // Ensure we disconnect even if there's an error
            await prisma.$disconnect();
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    };
}
