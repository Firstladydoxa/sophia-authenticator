const crypto = require('crypto');

// Base32 to bytes conversion (from your totp.ts)
function base32ToBytes(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedBase32 = base32.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
  
  const bytes = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanedBase32.length; i++) {
    const char = cleanedBase32[i];
    const idx = alphabet.indexOf(char);
    
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

// HMAC-SHA1
function hmacSha1(key, message) {
  const blockSize = 64;
  let keyBlock = Buffer.alloc(blockSize);

  if (key.length > blockSize) {
    const hash = crypto.createHash('sha1').update(key).digest();
    keyBlock = Buffer.concat([hash, Buffer.alloc(blockSize - hash.length)]);
  } else {
    keyBlock = Buffer.concat([key, Buffer.alloc(blockSize - key.length)]);
  }

  const oKeyPad = Buffer.alloc(blockSize);
  const iKeyPad = Buffer.alloc(blockSize);

  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyBlock[i] ^ 0x5c;
    iKeyPad[i] = keyBlock[i] ^ 0x36;
  }

  const innerData = Buffer.concat([iKeyPad, message]);
  const innerHash = crypto.createHash('sha1').update(innerData).digest();

  const outerData = Buffer.concat([oKeyPad, innerHash]);
  const outerHash = crypto.createHash('sha1').update(outerData).digest();

  return outerHash;
}

// Generate TOTP
function generateTOTP(secret, timeStep = 30, digits = 6) {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  
  console.log('Epoch:', epoch);
  console.log('Counter:', counter);
  
  const secretBytes = base32ToBytes(secret.replace(/\s/g, '').toUpperCase());
  console.log('Secret bytes:', secretBytes.toString('hex'));
  
  const counterBytes = Buffer.alloc(8);
  let counterValue = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counterValue & 0xff;
    counterValue = Math.floor(counterValue / 256);
  }
  console.log('Counter bytes:', counterBytes.toString('hex'));
  
  const hmac = hmacSha1(secretBytes, counterBytes);
  console.log('HMAC:', hmac.toString('hex'));
  
  const offset = hmac[hmac.length - 1] & 0x0f;
  console.log('Offset:', offset);
  
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  console.log('Binary:', binary);
  
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

// Test with a secret
const secret = process.argv[2] || 'JBSWY3DPEHPK3PXP';
console.log('\n=== Testing Custom Auth App TOTP ===');
console.log('Secret:', secret);
console.log('Time:', new Date().toISOString());
console.log('\nGenerated code:', generateTOTP(secret));
