import { verifyToken } from './auth';
export async function getAuthUser(request) {
    var _a;
    const token = (_a = request.cookies.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
    if (!token) {
        return null;
    }
    const payload = await verifyToken(token);
    if (!payload) {
        return null;
    }
    return payload;
}
export async function requireAuth(request, role) {
    const user = await getAuthUser(request);
    if (!user) {
        throw new Error('Unauthorized');
    }
    if (role && user.role !== role) {
        throw new Error('Forbidden');
    }
    return user;
}
