import { NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/security-middleware';
import { handleEmailRequest } from '@/lib/email-service';

async function handler(req) {
    try {
        if (req.method !== 'POST') {
            return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
        }

        const result = await handleEmailRequest(req);
        
        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json(result, { status: 400 });
        }

    } catch (error) {
        console.error('Email API error:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}

export const POST = withApiSecurity(handler, { requireAuth: true }); 