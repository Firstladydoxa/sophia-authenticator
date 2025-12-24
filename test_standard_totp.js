const speakeasy = require('speakeasy');

const secret = process.argv[2] || 'JBSWY3DPEHPK3PXP';

console.log('\n=== Testing Standard TOTP (speakeasy) ===');
console.log('Secret:', secret);
console.log('Time:', new Date().toISOString());
console.log('Epoch:', Math.floor(Date.now() / 1000));

const token = speakeasy.totp({
  secret: secret,
  encoding: 'base32',
  algorithm: 'sha1',
  digits: 6,
  step: 30
});

console.log('Generated code:', token);

// Verify with a window
const verifyResults = [];
for (let i = -2; i <= 2; i++) {
  const testToken = speakeasy.totp({
    secret: secret,
    encoding: 'base32',
    algorithm: 'sha1',
    digits: 6,
    step: 30,
    time: Math.floor(Date.now() / 1000) + (i * 30)
  });
  verifyResults.push(`${i * 30}s: ${testToken}`);
}
console.log('\nCodes in window:');
console.log(verifyResults.join('\n'));
