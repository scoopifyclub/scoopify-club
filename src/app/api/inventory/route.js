import { NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/security-middleware';
import { prisma } from '@/lib/prisma';

async function handler(req) {
    try {
        if (req.method === 'GET') {
            // Get inventory items
            const inventory = await prisma.inventoryItem.findMany({
                orderBy: { name: 'asc' }
            });
            
            return NextResponse.json({ success: true, inventory });
            
        } else if (req.method === 'POST') {
            // Add new inventory item
            const { name, category, quantity, minQuantity, unit, cost } = await req.json();
            
            if (!name || !category || quantity === undefined) {
                return NextResponse.json({ error: 'Name, category, and quantity are required' }, { status: 400 });
            }
            
            const item = await prisma.inventoryItem.create({
                data: {
                    name,
                    category,
                    quantity: parseInt(quantity),
                    minQuantity: parseInt(minQuantity) || 0,
                    unit,
                    cost: parseFloat(cost) || 0
                }
            });
            
            return NextResponse.json({ success: true, item }, { status: 201 });
            
        } else if (req.method === 'PUT') {
            // Update inventory item
            const { id, quantity, cost } = await req.json();
            
            if (!id || quantity === undefined) {
                return NextResponse.json({ error: 'ID and quantity are required' }, { status: 400 });
            }
            
            const item = await prisma.inventoryItem.update({
                where: { id: parseInt(id) },
                data: {
                    quantity: parseInt(quantity),
                    cost: cost ? parseFloat(cost) : undefined,
                    lastUpdated: new Date()
                }
            });
            
            return NextResponse.json({ success: true, item });
            
        } else {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }
        
    } catch (error) {
        console.error('Inventory management error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withApiSecurity(handler, { requireAuth: true });
export const POST = withApiSecurity(handler, { requireAuth: true });
export const PUT = withApiSecurity(handler, { requireAuth: true }); 