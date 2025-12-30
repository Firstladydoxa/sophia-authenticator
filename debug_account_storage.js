// Debug script to check stored accounts
// Note: This is a reference for debugging - React Native uses AsyncStorage which can't be accessed from Node.js
// Use React Native Debugger or console.log in the app to see actual stored data

console.log('='.repeat(80));
console.log('ACCOUNT STORAGE DEBUG GUIDE');
console.log('='.repeat(80));

console.log(`
To debug "Account Not Found" issue, add this code to your Authenticator app:

1. In ApproveLoginScreen.tsx (already added):
   - Check console logs for account matching details
   - Look for: [ApproveLogin] All accounts: X
   - Check each account's structure

2. What a correctly stored account should look like:
   {
     "id": "ambassador-app-12345_1766956651363",
     "issuer": "Ambassador App",
     "account": "test@example.com",
     "secret": "BASE32SECRET",
     "digits": 6,
     "period": 30,
     "createdAt": 1766956651363,
     "appId": "ambassador-app-12345",           // ✅ REQUIRED for login matching
     "apiUrl": "https://ambassadorsapi.tniglobal.org",
     "isCentralizedAuth": true,                 // ✅ REQUIRED for login matching
     "authMethods": ["totp"]
   }

3. Common Issues:

   ❌ ISSUE 1: Missing appId
   {
     "account": "test@example.com",
     "appId": undefined              // Missing!
   }
   
   ❌ ISSUE 2: Missing isCentralizedAuth
   {
     "account": "test@example.com",
     "appId": "ambassador-app-12345",
     "isCentralizedAuth": undefined  // Missing!
   }
   
   ❌ ISSUE 3: App ID Mismatch
   Setup QR had:     app_id: "ambassador-app-12345"
   Login QR has:     app_id: "ambassador-app-67890"  // Different!
   Stored account:   appId: "ambassador-app-12345"
   Result: Account not found because app_id doesn't match

4. Debugging Steps:

   A. Check what's stored:
      - Run Authenticator app
      - Scan login QR
      - Check Metro console for:
        [ApproveLogin] Looking for account with:
          Email: test@example.com
          App ID: ambassador-app-12345
        [ApproveLogin] All accounts: 1
        [ApproveLogin] Account 0: {...}
   
   B. Compare stored vs. expected:
      - Does account.account match the email in login QR?
      - Does account.appId match the app_id in login QR?
      - Is account.isCentralizedAuth === true?
   
   C. If any mismatch:
      - Delete the account from Authenticator
      - Re-scan the setup QR from Ambassador settings
      - Try login again

5. Matching Logic (in ApproveLoginScreen):

   The app tries 3 levels of matching:
   
   LEVEL 1 (Strict):
     account.account === email
     AND account.appId === app_id
     AND account.isCentralizedAuth === true
   
   LEVEL 2 (Flexible):
     account.account === email
     AND (account.appId === app_id OR app_id is in account.id)
   
   LEVEL 3 (Loose):
     account.account === email
     AND account.isCentralizedAuth === true

6. Fix for Existing Accounts:

   If you added an account BEFORE the fix was applied:
   
   Option A: Delete and Re-add
     1. Delete Ambassador account from Authenticator
     2. Re-scan setup QR from Ambassador settings
     3. Account will now have appId and isCentralizedAuth
   
   Option B: Manual Update (for developers)
     - Use React Native Debugger
     - Manually update the account in AsyncStorage
     - Add the missing fields

7. Verify Setup QR Format:

   Your Ambassador setup QR MUST include these fields:
   
   {
     "type": "tni-bouquet-account",
     "issuer": "Ambassador App",
     "account": "user@example.com",
     "secret": "BASE32SECRET",
     "app_id": "ambassador-app-12345",    // ✅ REQUIRED
     "apiUrl": "https://api.url.com"      // ✅ REQUIRED
   }

8. Verify Login QR Format:

   Your Ambassador login QR MUST have matching app_id:
   
   {
     "type": "tni-bouquet-login",
     "email": "user@example.com",
     "temp_token": "temp123",
     "app_id": "ambassador-app-12345",    // ✅ Must match setup QR!
     "timestamp": 1766956651363
   }

9. Console Commands for Debugging:

   In React Native Debugger console:
   
   // Get all accounts
   AsyncStorage.getItem('@authenticator_accounts')
     .then(data => console.log(JSON.parse(data)));
   
   // Check specific account
   AsyncStorage.getItem('@authenticator_accounts')
     .then(data => {
       const parsed = JSON.parse(data);
       const ambassadorAccount = parsed.accounts.find(
         acc => acc.issuer === 'Ambassador App'
       );
       console.log('Ambassador Account:', ambassadorAccount);
     });

10. Test Flow:

    Step 1: Setup
      - Generate setup QR in Ambassador settings
      - Verify JSON has all required fields
      - Scan in Authenticator
      - Check console logs confirm account added with appId
    
    Step 2: Login
      - Generate login QR on Ambassador login page
      - Verify app_id matches setup QR
      - Scan in Authenticator
      - Should show "Approve Login" screen (not "Account Not Found")
    
    Step 3: Verify
      - Check console logs show successful match
      - Authenticate and approve
      - Confirm login succeeds in Ambassador
`);

console.log('='.repeat(80));
console.log('For live debugging, check the Authenticator app Metro console');
console.log('Look for [ApproveLogin] and [ScanQR] log messages');
console.log('='.repeat(80));
