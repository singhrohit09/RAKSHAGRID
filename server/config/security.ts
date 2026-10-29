import crypto from 'crypto';

const INSECURE_DEFAULT_SECRETS = [
  'rakshagrid-dev-secret-key-change-in-production-2026',
  'secret',
  'password',
  '12345678',
  'change-me',
  'default-jwt-secret',
  'development-secret-key'
];

let cachedJwtSecret: string | null = null;

export function resetJwtSecretCacheForTesting(): void {
  cachedJwtSecret = null;
}

/**
 * Returns a cryptographically validated JWT secret.
 * In production: fails safely if missing, too short (<32 chars), or matches known placeholders.
 * In development/test: generates an ephemeral 256-bit random secret if none is configured.
 */
export function getValidatedJwtSecret(): string {
  if (cachedJwtSecret) return cachedJwtSecret;

  const envSecret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!envSecret) {
      throw new Error('FATAL CONFIGURATION: JWT_SECRET environment variable is missing in production.');
    }
    if (envSecret.length < 32) {
      throw new Error('FATAL CONFIGURATION: JWT_SECRET must be at least 32 characters in production.');
    }
    if (INSECURE_DEFAULT_SECRETS.includes(envSecret)) {
      throw new Error('FATAL CONFIGURATION: JWT_SECRET is set to a compromised or placeholder default value.');
    }
    cachedJwtSecret = envSecret;
    return cachedJwtSecret;
  }

  if (envSecret && envSecret.length >= 16) {
    cachedJwtSecret = envSecret;
  } else {
    // Generate high-entropy ephemeral secret for development/testing
    cachedJwtSecret = crypto.randomBytes(32).toString('hex');
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  [SECURITY NOTICE] No secure JWT_SECRET set. Using ephemeral 256-bit secret for this session.');
    }
  }

  return cachedJwtSecret;
}

/**
 * Evaluates password strength to enforce security policies.
 * Requires at least 10 characters with uppercase, lowercase, digit, and special symbol.
 */
export function isPasswordStrong(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Password is required.' };
  }
  if (password.length < 10) {
    return { valid: false, reason: 'Password must be at least 10 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one numerical digit.' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character symbol.' };
  }
  return { valid: true };
}

/**
 * Generates a cryptographically random, high-entropy password.
 */
export function generateSecurePassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  // Ensure all required classes are present
  if (!isPasswordStrong(result).valid) {
    return generateSecurePassword(length);
  }
  return result;
}

/**
 * Generates a high-entropy random token (e.g. for password resets or CSRF).
 */
export function generateCryptographicToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hashes a token using SHA-256 for safe storage in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validates production environment safety at startup.
 */
export function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV !== 'production') return;

  // Validate JWT secret
  getValidatedJwtSecret();

  // Validate Client Origin
  const clientOrigin = process.env.CLIENT_ORIGIN?.trim();
  if (!clientOrigin || clientOrigin === '*' || clientOrigin.includes('localhost') || clientOrigin.includes('127.0.0.1')) {
    console.warn('⚠️  [SECURITY WARNING] CLIENT_ORIGIN should be configured with a production domain.');
  }
}
