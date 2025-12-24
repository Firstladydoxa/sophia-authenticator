const crypto = require('crypto');
const speakeasy = require('speakeasy');

const secret = 'RCH2R23L4VCRBLBS';
const epoch = Math.floor(Date.now() / 1000);

console.log('=== TOTP Comparison Test ===');
console.log('Secret:', secret);
console.log('Epoch:', epoch);
console.log('Time:', new Date().toISOString());
console.log('');

// Standard implementation
const standardCode = speakeasy.totp({
  secret: secret,
  encoding: 'base32',
  algorithm: 'sha1',
  digits: 6,
  step: 30
});
console.log('Standard (speakeasy):', standardCode);

// Now test custom implementation from test_totp.js
function base32ToBytes(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedBase32 = base32.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
  
  const bytes = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanedBase32.length; i++) {
    const char = cleanedBase32[i];
    const idx = alphabet.indexOf(char);
    
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hmacSha1(key, message) {
  return crypto.createHmac('sha1', key).update(message).digest();
}

function generateCustomTOTP(secret, timeStep = 30, digits = 6) {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  
  const secretBytes = base32ToBytes(secret.replace(/\s/g, '').toUpperCase());
  
  const counterBytes = Buffer.alloc(8);
  let counterValue = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counterValue & 0xff;
    counterValue = Math.floor(counterValue / 256);
  }
  
  const hmac = hmacSha1(secretBytes, counterBytes);
  const offset = hmac[hmac.length - 1] & 0x0f;
  
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

const customCode = generateCustomTOTP(secret);
console.log('Custom implementation:', customCode);

console.log('');
console.log('Match:', standardCode === customCode ? '✅ YES' : '❌ NO');
if (standardCode !== customCode) {
  console.log('Difference:', parseInt(customCode) - parseInt(standardCode));
}
