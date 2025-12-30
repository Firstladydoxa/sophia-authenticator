// Test script to generate and display sample QR codes
// Run with: node test_qr_generation.js

const QRCode = require('qrcode');

console.log('='.repeat(60));
console.log('QR CODE GENERATION TEST');
console.log('='.repeat(60));

// 1. SETUP QR CODE (for adding account - ONE TIME)
const setupQR = {
  type: 'tni-bouquet-account',
  issuer: 'Ambassador App',
  account: 'test@example.com',
  secret: 'JBSWY3DPEHPK3PXP',
  app_id: 'ambassador-app-12345',
  apiUrl: 'https://ambassadorsapi.tniglobal.org'
};

console.log('\n1. SETUP QR CODE (Add Account - One Time)');
console.log('-'.repeat(60));
console.log('JSON Data:');
console.log(JSON.stringify(setupQR, null, 2));
console.log('\nQR Code String:');
console.log(JSON.stringify(setupQR));

QRCode.toString(JSON.stringify(setupQR), { type: 'terminal' }, (err, url) => {
  if (!err) console.log('\nQR Code:\n' + url);
});

// 2. LOGIN QR CODE (for login approval - EVERY TIME)
const loginQR = {
  type: 'tni-bouquet-login',
  email: 'test@example.com',
  temp_token: 'temp_token_abc123xyz',
  app_id: 'ambassador-app-12345',
  timestamp: Date.now()
};

console.log('\n\n2. LOGIN QR CODE (Approve Login - Every Time)');
console.log('-'.repeat(60));
console.log('JSON Data:');
console.log(JSON.stringify(loginQR, null, 2));
console.log('\nQR Code String:');
console.log(JSON.stringify(loginQR));

QRCode.toString(JSON.stringify(loginQR), { type: 'terminal' }, (err, url) => {
  if (!err) console.log('\nQR Code:\n' + url);
});

console.log('\n' + '='.repeat(60));
console.log('KEY DIFFERENCES:');
console.log('='.repeat(60));
console.log('Setup QR has:');
console.log('  - type: "tni-bouquet-account"');
console.log('  - issuer, secret, apiUrl fields');
console.log('  - Used ONCE to add account');
console.log('');
console.log('Login QR has:');
console.log('  - type: "tni-bouquet-login"');
console.log('  - email, temp_token, timestamp fields');
console.log('  - Used EVERY TIME for login');
console.log('='.repeat(60));

// Generate HTML files for visual testing
const fs = require('fs');

QRCode.toDataURL(JSON.stringify(setupQR), (err, setupUrl) => {
  if (!err) {
    const setupHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Setup QR - Add Account</title>
  <style>
    body { font-family: Arial; text-align: center; padding: 50px; }
    h1 { color: #007AFF; }
    .qr { margin: 20px auto; }
    pre { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: left; max-width: 600px; margin: 20px auto; }
  </style>
</head>
<body>
  <h1>🔐 Setup QR Code</h1>
  <p><strong>Use this to ADD ACCOUNT (One Time)</strong></p>
  <div class="qr">
    <img src="${setupUrl}" width="300" height="300" />
  </div>
  <h3>JSON Data:</h3>
  <pre>${JSON.stringify(setupQR, null, 2)}</pre>
  <p><em>Type: tni-bouquet-account</em></p>
</body>
</html>
    `;
    fs.writeFileSync('test_setup_qr.html', setupHtml);
    console.log('\n✅ Generated: test_setup_qr.html');
  }
});

QRCode.toDataURL(JSON.stringify(loginQR), (err, loginUrl) => {
  if (!err) {
    const loginHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Login QR - Approve Login</title>
  <style>
    body { font-family: Arial; text-align: center; padding: 50px; }
    h1 { color: #34C759; }
    .qr { margin: 20px auto; }
    pre { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: left; max-width: 600px; margin: 20px auto; }
  </style>
</head>
<body>
  <h1>🔓 Login QR Code</h1>
  <p><strong>Use this to APPROVE LOGIN (Every Time)</strong></p>
  <div class="qr">
    <img src="${loginUrl}" width="300" height="300" />
  </div>
  <h3>JSON Data:</h3>
  <pre>${JSON.stringify(loginQR, null, 2)}</pre>
  <p><em>Type: tni-bouquet-login</em></p>
</body>
</html>
    `;
    fs.writeFileSync('test_login_qr.html', loginHtml);
    console.log('✅ Generated: test_login_qr.html');
    console.log('\n📱 Open these HTML files in a browser and scan with the Authenticator app!\n');
  }
});
