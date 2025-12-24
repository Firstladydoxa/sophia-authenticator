const { authenticator } = require('otplib');

const secret = 'RCH2R23L4VCRBLBS';

console.log('=== Testing otplib ===');
console.log('Secret:', secret);
console.log('Time:', new Date().toISOString());

const token = authenticator.generate(secret);
console.log('Generated code:', token);

// Verify it matches
const isValid = authenticator.check(token, secret);
console.log('Self-verification:', isValid ? '✅ Valid' : '❌ Invalid');

// Show window
console.log('\nCodes in time window:');
for (let i = -2; i <= 2; i++) {
  const time = Math.floor(Date.now() / 1000) + (i * 30);
  const code = authenticator.generate(secret);
  console.log(`Window ${i}: ${code}`);
}
