import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { login } from '@/lib/auth';
export async function POST(request) {
    var _a, _b, _c;
    console.log('Login request received');
    try {
        const body = await request.json();
        console.log('Request body parsed:', { email: body.email });
        const { email, password } = body;
        if (!email || !password) {
            console.log('Missing email or password');
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }
        console.log('Getting cookie store');
        const cookieStore = await cookies();
        const existingFingerprint = (_a = cookieStore.get('fingerprint')) === null || _a === void 0 ? void 0 : _a.value;
        console.log('Existing fingerprint:', existingFingerprint ? 'Present' : 'Not found');
        console.log('Attempting login');
        const { accessToken, refreshToken, user, deviceFingerprint } = await login(email, password, existingFingerprint);
        console.log('Login successful for user:', { id: user.id, role: user.role });
        // Create response with user data
        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                customerId: (_b = user.customer) === null || _b === void 0 ? void 0 : _b.id,
                employeeId: (_c = user.employee) === null || _c === void 0 ? void 0 : _c.id,
            },
            accessToken,
            refreshToken
        });
        console.log('Setting cookies');
        // Set HTTP-only cookies
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60, // 15 minutes
        });
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        response.cookies.set('fingerprint', deviceFingerprint, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        console.log('Cookies set successfully');
        return response;
    }
    catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
            if (error.message.includes('Invalid email or password')) {
                return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
            }
            if (error.message.includes('Too many login attempts')) {
                return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
            }
        }
        return NextResponse.json({ error: 'Login failed' }, { status: 401 });
    }
}
