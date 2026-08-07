/**
 * Key Generation Helper for OTA Update Code Signing
 *
 * This script generates a base64-encoded key pair for signing OTA updates.
 *
 * Usage:
 *   node scripts/generate-keys.js
 *
 * Output:
 *   - Private key (base64) -> Store as GitHub Secret: UPDATE_CODE_SIGNING_PRIVATE_KEY
 *   - Public key (base64)  -> Store as GitHub Secret: UPDATE_CODE_SIGNING_PUBLIC_KEY
 *                             Also embed in app.json expo.updates.codeSigningCertificate
 *
 * IMPORTANT: The private key must NEVER be committed to the repository.
 * Store it only in GitHub Secrets or your local environment.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('OTA Update Code Signing Key Generator');
console.log('========================================\n');

// Generate a 256-bit secret for HMAC signing (Expo uses symmetric keys)
const secret = crypto.randomBytes(32);
const secretBase64 = secret.toString('base64');

console.log('Private Key (base64):');
console.log(secretBase64);
console.log('\nPublic Key (base64):');
console.log(secretBase64); // For HMAC, the same key is used for signing and verification

console.log('\n----------------------------------------');
console.log('NEXT STEPS:\n');
console.log('1. Go to GitHub repo > Settings > Secrets and variables > Actions');
console.log('2. Add secret: UPDATE_CODE_SIGNING_PRIVATE_KEY = ' + secretBase64);
console.log('3. Add secret: EXPO_TOKEN = <your expo access token>');
console.log('4. Run: eas update:secret:create');
console.log('   - Name: UPDATE_CODE_SIGNING_PRIVATE_KEY');
console.log('   - Type: base64');
console.log('   - Value: ' + secretBase64);
console.log('5. The app.json already references the key from EAS secrets.\n');

// Optionally save to a local file (gitignored)
const keysDir = path.join(__dirname, '..', '.keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const keyFile = path.join(keysDir, 'update-key.txt');
fs.writeFileSync(keyFile, `Private Key (base64): ${secretBase64}\n\nStore this in GitHub Secrets and EAS Secrets.\nNEVER commit this file to the repository.\n`, 'utf8');

console.log(`Keys saved to: ${keyFile}`);
console.log('WARNING: This file is gitignored. Do NOT commit it.\n');

// Check if .gitignore has .keys entry
const gitignorePath = path.join(__dirname, '..', '.gitignore');
let gitignore = '';
if (fs.existsSync(gitignorePath)) {
  gitignore = fs.readFileSync(gitignorePath, 'utf8');
}
if (!gitignore.includes('.keys/')) {
  fs.appendFileSync(gitignorePath, '\n# OTA update keys - NEVER commit\n.keys/\n');
  console.log('Added .keys/ to .gitignore');
}
