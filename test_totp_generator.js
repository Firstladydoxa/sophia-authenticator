const { TOTP } = require('totp-generator');

const secret = 'RCH2R23L4VCRBLBS';

console.log('=== Testing totp-generator ===');
console.log('Secret:', secret);
console.log('Time:', new Date().toISOString());

TOTP.generate(secret, {
  period: 30,
  digits: 6,
  algorithm: 'SHA-1'
}).then(result => {
  console.log('Generated code:', result.otp);
  
  // Compare with backend
  const { execSync } = require('child_process');
  const backendCode = execSync(
    'cd ~/public_html/ambassadors/server && php -r "require \'vendor/autoload.php\'; use PragmaRX\\\\Google2FA\\\\Google2FA; \\$g2fa = new Google2FA(); echo \\$g2fa->getCurrentOtp(\'RCH2R23L4VCRBLBS\');"'
  ).toString().trim();
  
  console.log('Backend expects:', backendCode);
  console.log('Match:', result.otp === backendCode ? '✅ YES' : '❌ NO');
});
