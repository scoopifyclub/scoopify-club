import { AuthUser } from '@/types/auth';
import { verifyJwt } from './jwt';

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = await verifyJwt(token);
    if (!decoded || !decoded.userId) {
      return null;
    }

    // In a real application, you would fetch the user from your database here
    // For now, we'll just return a mock user
    return {
      id: decoded.userId,
      role: decoded.role as UserRole,
      email: decoded.email || '',
      name: decoded.name || ''
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
