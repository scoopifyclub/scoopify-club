import { NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/security-middleware';
import { prisma } from '@/lib/prisma';

async function handler(req) {
    try {
        if (req.method === 'POST') {
            // Submit customer feedback
            const { serviceId, customerId, rating, review, category } = await req.json();
            
            if (!serviceId || !customerId || !rating) {
                return NextResponse.json({ error: 'Service ID, Customer ID, and Rating are required' }, { status: 400 });
            }
            
            if (rating < 1 || rating > 5) {
                return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
            }
            
            // Create feedback record
            const feedback = await prisma.customerFeedback.create({
                data: {
                    serviceId: parseInt(serviceId),
                    customerId: parseInt(customerId),
                    rating: parseInt(rating),
                    review,
                    category: category || 'GENERAL',
                    status: 'ACTIVE'
                }
            });
            
            // Update service with feedback
            await prisma.service.update({
                where: { id: parseInt(serviceId) },
                data: { 
                    hasFeedback: true,
                    feedbackRating: parseInt(rating)
                }
            });
            
            return NextResponse.json({ success: true, feedback }, { status: 201 });
            
        } else if (req.method === 'GET') {
            // Get feedback records
            const { serviceId, customerId, rating, category } = req.nextUrl.searchParams;
            
            const where = {};
            if (serviceId) where.serviceId = parseInt(serviceId);
            if (customerId) where.customerId = parseInt(customerId);
            if (rating) where.rating = parseInt(rating);
            if (category) where.category = category;
            
            const feedback = await prisma.customerFeedback.findMany({
                where,
                include: {
                    service: true,
                    customer: {
                        include: { user: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            
            // Calculate average rating
            const avgRating = feedback.length > 0 
                ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
                : 0;
            
            return NextResponse.json({ 
                success: true, 
                feedback,
                averageRating: Math.round(avgRating * 10) / 10,
                totalFeedback: feedback.length
            });
            
        } else {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }
        
    } catch (error) {
        console.error('Customer feedback error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withApiSecurity(handler, { requireAuth: true });
export const POST = withApiSecurity(handler, { requireAuth: true }); 