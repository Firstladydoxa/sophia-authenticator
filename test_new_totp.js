const { authenticator } = require('otplib');

const secret = 'RCH2R23L4VCRBLBS';

// This is what the new utils/totp.ts does
authenticator.options = {
  step: 30,
  digits: 6
};

const code = authenticator.generate(secret.replace(/\s/g, '').toUpperCase());

console.log('=== New Implementation Test ===');
console.log('Secret:', secret);
console.log('Generated code:', code);
console.log('Time:', new Date().toISOString());
