import { Request, Response, NextFunction } from 'express';
import { extractTokenFromRequest, verifySessionToken, UserSessionPayload } from '../auth/jwt.js';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: UserSessionPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = extractTokenFromRequest(req);

  if (!token) {
    res.status(401).json({
      error: 'Authentication required. Please provide a valid session token.',
      code: 'UNAUTHENTICATED'
    });
    return;
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    res.status(401).json({
      error: 'Session expired or token invalid. Please log in again.',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Optional authentication: attaches user if token is present and valid,
 * but allows public requests if no token is sent.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractTokenFromRequest(req);
  if (token) {
    const payload = verifySessionToken(token);
    if (payload) {
      req.user = payload;
    }
  }
  next();
}

