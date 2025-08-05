import { NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/security-middleware';

async function optimizeRoute(services) {
    // Simple route optimization algorithm
    // In production, you'd integrate with Google Maps API or similar
    const optimizedServices = [...services].sort((a, b) => {
        // Sort by distance from a central point (could be office location)
        const centerLat = 40.7128; // Example: NYC coordinates
        const centerLng = -74.0060;
        
        const distA = Math.sqrt(
            Math.pow(a.latitude - centerLat, 2) + 
            Math.pow(a.longitude - centerLng, 2)
        );
        const distB = Math.sqrt(
            Math.pow(b.latitude - centerLat, 2) + 
            Math.pow(b.longitude - centerLng, 2)
        );
        
        return distA - distB;
    });
    
    return optimizedServices;
}

async function handler(req) {
    try {
        if (req.method !== 'POST') {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }

        const { services, employeeId, date } = await req.json();
        
        if (!services || !Array.isArray(services)) {
            return NextResponse.json({ error: 'Services array is required' }, { status: 400 });
        }

        // Optimize the route
        const optimizedRoute = await optimizeRoute(services);
        
        // Calculate estimated time and distance
        const totalDistance = optimizedRoute.reduce((total, service, index) => {
            if (index === 0) return 0;
            const prevService = optimizedRoute[index - 1];
            const distance = Math.sqrt(
                Math.pow(service.latitude - prevService.latitude, 2) + 
                Math.pow(service.longitude - prevService.longitude, 2)
            ) * 69; // Rough conversion to miles
            return total + distance;
        }, 0);
        
        const estimatedTime = totalDistance * 2; // 2 minutes per mile average
        
        return NextResponse.json({
            success: true,
            optimizedRoute,
            totalDistance: Math.round(totalDistance * 100) / 100,
            estimatedTime: Math.round(estimatedTime),
            efficiency: Math.round((1 - (totalDistance / (services.length * 5))) * 100) // Efficiency percentage
        });
        
    } catch (error) {
        console.error('Route optimization error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const POST = withApiSecurity(handler, { requireAuth: true }); 