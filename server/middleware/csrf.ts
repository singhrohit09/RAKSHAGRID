import { Request, Response, NextFunction } from 'express';

const MUTATION_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export function csrfProtection(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only check mutation methods
    if (!MUTATION_METHODS.includes(req.method.toUpperCase())) {
      return next();
    }

    // If request uses ambient cookie authentication (vulnerable to CSRF)
    const hasSessionCookie = Boolean(req.cookies && req.cookies.raksha_session);
    if (!hasSessionCookie) {
      // Authorization Bearer headers are not attached automatically by browsers
      return next();
    }

    // Exempt login, register, and forgot-password from CSRF token checks
    const publicAuthPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];
    if (publicAuthPaths.includes(req.path)) {
      return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const hasCustomHeader = Boolean(req.headers['x-requested-with'] || req.headers['x-raksha-csrf']);

    // Check Origin or Referer if present
    if (origin) {
      const isAllowedOrigin = allowedOrigins.includes(origin);
      if (!isAllowedOrigin) {
        return res.status(403).json({
          error: 'Cross-Site Request Forgery (CSRF) protection: Request origin is unauthorized.'
        });
      }
    } else if (referer) {
      const isAllowedReferer = allowedOrigins.some(ao => referer.startsWith(ao));
      if (!isAllowedReferer) {
        return res.status(403).json({
          error: 'Cross-Site Request Forgery (CSRF) protection: Request referer is unauthorized.'
        });
      }
    } else if (!hasCustomHeader && process.env.NODE_ENV === 'production') {
      // In production, require custom header or origin when cookie is used
      return res.status(403).json({
        error: 'Cross-Site Request Forgery (CSRF) protection: Missing verification header.'
      });
    }

    next();
  };
}

