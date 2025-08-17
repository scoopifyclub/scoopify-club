import axios from 'axios';
import prisma from "./prisma";
const config = {
    clientId: process.env.CASHAPP_CLIENT_ID || '',
    clientSecret: process.env.CASHAPP_CLIENT_SECRET || '',
    apiUrl: process.env.CASHAPP_API_URL || 'https://api.cash.app/v1',
};
export async function createCashAppPayment(amount) {
    const payment = await prisma.cashAppPayment.create({
        data: {
            amount,
            status: 'pending',
        },
    });
    return payment;
}
export async function getCashAppPayment(id) {
    return prisma.cashAppPayment.findUnique({
        where: { id },
    });
}
export async function updateCashAppPaymentStatus(id, status) {
    return prisma.cashAppPayment.update({
        where: { id },
        data: { status },
    });
}
export function generateCashAppQRCode(amount) {
    // Generate a real Cash App payment URL
    // Format: https://cash.app/$[username]/[amount]
    const username = process.env.CASHAPP_USERNAME || 'scoopifyclub';
    const formattedAmount = parseFloat(amount).toFixed(2);
    return `https://cash.app/$${username}/${formattedAmount}`;
}
export async function createPayment(request) {
    try {
        const response = await axios.post(`${config.apiUrl}/payments`, request, {
            headers: {
                'Authorization': `Bearer ${config.clientSecret}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error creating CashApp payment:', error);
        throw new Error('Failed to create payment');
    }
}
export async function getPaymentStatus(paymentId) {
    try {
        const response = await axios.get(`${config.apiUrl}/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${config.clientSecret}`,
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error getting payment status:', error);
        throw new Error('Failed to get payment status');
    }
}
export async function processReferralPayment(userId, amount) {
    try {
        const paymentRequest = {
            amount,
            currency: 'USD',
            recipientId: userId,
            note: 'Referral bonus payment',
        };
        return await createPayment(paymentRequest);
    }
    catch (error) {
        console.error('Error processing referral payment:', error);
        throw new Error('Failed to process referral payment');
    }
}
export default {
    createPayment,
    getPaymentStatus,
    processReferralPayment,
    createCashAppPayment,
    getCashAppPayment,
    updateCashAppPaymentStatus,
    generateCashAppQRCode,
};
