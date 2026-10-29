import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';
import { generateSecurePassword, isPasswordStrong } from '../config/security.js';

/**
 * First-Administrator Provisioning Utility
 * Run via: npm run server:bootstrap-admin
 * Usage:
 *   npx tsx server/scripts/bootstrap-admin.ts [--email admin@example.com] [--password YourPassword] [--force]
 */
export async function bootstrapAdmin(options: {
  email?: string;
  password?: string;
  displayName?: string;
  force?: boolean;
} = {}): Promise<{ email: string; temporaryPassword?: string }> {
  await db.initSchema();

  const email = (options.email || process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@rakshagrid.gov.in').toLowerCase().trim();
  const displayName = options.displayName || 'Operations Administrator';

  // Check if admin already exists
  const existingAdmin = await db.get<{ id: string; email: string }>(
    "SELECT id, email FROM users WHERE role = 'admin' LIMIT 1"
  );

  if (existingAdmin && !options.force) {
    console.log(`ℹ️  Administrator account already provisioned (${existingAdmin.email}).`);
    console.log('   Use --force flag if you need to re-provision or reset the administrator.');
    return { email: existingAdmin.email };
  }

  // Determine password
  let plainPassword = options.password || process.env.BOOTSTRAP_ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD;
  let isGenerated = false;

  if (!plainPassword) {
    plainPassword = generateSecurePassword(16);
    isGenerated = true;
  } else {
    const strength = isPasswordStrong(plainPassword);
    if (!strength.valid) {
      throw new Error(`Insecure bootstrap password: ${strength.reason}`);
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPassword, salt);
  const now = new Date().toISOString();

  const userWithEmail = await db.get<{ id: string }>(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  const userId = userWithEmail ? userWithEmail.id : (email === 'admin@rakshagrid.gov.in' ? 'USR-ADMIN-01' : `USR-ADMIN-${Date.now().toString().slice(-6)}`);

  await db.run(
    `INSERT OR REPLACE INTO users (id, email, password_hash, display_name, role, department, callsign, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'admin', 'State Disaster Management Authority (SDMA)', 'COMMAND-01', ?, ?)`,
    [userId, email, passwordHash, displayName, now, now]
  );

  console.log('\n======================================================');
  console.log('🛡️  RakshaGrid First-Administrator Provisioning Complete');
  console.log('======================================================');
  console.log(`Account Email: ${email}`);
  console.log(`User Role:     admin (State Incident Command Authority)`);
  if (isGenerated) {
    console.log(`Generated Password: ${plainPassword}`);
    console.log('\n⚠️  SAVE THIS TEMPORARY PASSWORD IMMEDIATELY.');
    console.log('It is displayed once and cannot be retrieved.');
  } else {
    console.log('Password:      [Configured from secure environment]');
  }
  console.log('======================================================\n');

  return { email, temporaryPassword: isGenerated ? plainPassword : '[CONFIGURED_SECRET]' };
}

// Standalone CLI execution
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('bootstrap-admin.ts')) {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf('--email');
  const passIdx = args.indexOf('--password');
  const force = args.includes('--force');

  const email = emailIdx !== -1 ? args[emailIdx + 1] : undefined;
  const password = passIdx !== -1 ? args[passIdx + 1] : undefined;

  bootstrapAdmin({ email, password, force })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Administrator bootstrap failed:', err.message);
      process.exit(1);
    });
}
