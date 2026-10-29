import crypto from 'crypto';

/**
 * CLI utility to generate cryptographically random secrets for JWT_SECRET or other keys.
 * Run via: npm run generate-secret
 */
function main() {
  const secret = crypto.randomBytes(32).toString('hex');
  console.log('🛡️  RakshaGrid Cryptographic Secret Generator');
  console.log('============================================');
  console.log(`Generated 256-bit Random Secret:`);
  console.log(`\n  ${secret}\n`);
  console.log('Copy and place into your production environment variables or secure vault as:');
  console.log(`  JWT_SECRET="${secret}"`);
  console.log('============================================');
}

main();
