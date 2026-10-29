import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { PersonaId } from '../../src/types/role.js';
import { getValidatedJwtSecret } from '../config/security.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export interface UserSessionPayload {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: PersonaId;
  department?: string;
  callsign?: string;
}

export function signSessionToken(payload: Partial<UserSessionPayload> & { email: string; displayName: string; role: PersonaId }): string {
  const secret = getValidatedJwtSecret();
  const normalized: UserSessionPayload = {
    id: payload.id || payload.userId || '',
    userId: payload.userId || payload.id || '',
    email: payload.email,
    displayName: payload.displayName,
    role: payload.role,
    department: payload.department,
    callsign: payload.callsign
  };
  return jwt.sign(normalized, secret, { expiresIn: JWT_EXPIRES_IN as any });
}

export function verifySessionToken(token: string): UserSessionPayload | null {
  try {
    const secret = getValidatedJwtSecret();
    return jwt.verify(token, secret) as UserSessionPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromRequest(req: Request): string | null {
  // 1. Check HttpOnly Cookie
  if (req.cookies && req.cookies.raksha_session) {
    return req.cookies.raksha_session;
  }

  // 2. Check Authorization Header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}
