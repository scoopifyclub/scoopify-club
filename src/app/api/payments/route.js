import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { createCashAppPayment, getCashAppPayment } from '@/lib/cashapp';
export async function POST(req) {
    var _a;
    try {
        const token = (_a = req.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const { amount, paymentMethod } = await req.json();
        if (!amount || !paymentMethod) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (paymentMethod === 'cashapp') {
            const payment = await createCashAppPayment(amount);
            return NextResponse.json({
                id: payment.id,
                status: payment.status,
                qrCode: `https://cash.app/pay/${amount}`,
            });
        }
        // Handle other payment methods here
        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }
    catch (error) {
        console.error('Payment error:', error);
        return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
    }
}
export async function GET(req) {
    var _a;
    try {
        const token = (_a = req.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const paymentId = searchParams.get('id');
        if (!paymentId) {
            return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
        }
        const payment = await getCashAppPayment(paymentId);
        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        return NextResponse.json(payment);
    }
    catch (error) {
        console.error('Payment status error:', error);
        return NextResponse.json({ error: 'Failed to get payment status' }, { status: 500 });
    }
}
