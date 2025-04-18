import { NextRequest } from 'next/server';
import { verifyToken } from './auth';
import { Role } from '@prisma/client';

export async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  return payload;
}

export async function requireAuth(request: NextRequest, role?: Role) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (role && user.role !== role) {
    throw new Error('Forbidden');
  }

  return user;
} 