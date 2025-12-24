# Authentication App

A fully-featured React Native authentication app built with Expo for managing Time-based One-Time Passwords (TOTP) for two-factor authentication.

## Features

✅ **Add Accounts**: Add new 2FA accounts manually or by scanning QR codes
✅ **Generate TOTP Codes**: Automatic generation of 6-8 digit time-based codes
✅ **QR Code Scanner**: Scan QR codes from service providers to quickly add accounts
✅ **Visual Timer**: Progress bar showing remaining time before code refresh
✅ **Copy to Clipboard**: Tap any code to copy it instantly
✅ **Persistent Storage**: Secure local storage of all accounts
✅ **Delete Accounts**: Remove accounts with confirmation
✅ **Custom Settings**: Configure code digits (6-8) and refresh period (15-60s)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on a platform**:
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for web

## Usage

### Adding an Account Manually

1. Tap the **"+ Add Manual"** button on the home screen
2. Fill in the account details:
   - **Issuer**: The service provider (e.g., Google, GitHub, AWS)
   - **Account**: Your username or email
   - **Secret Key**: The base32 secret provided by the service
   - **Digits**: Number of digits in the code (default: 6)
   - **Period**: Refresh interval in seconds (default: 30)
3. Tap **"Add Account"**

### Scanning a QR Code

1. Tap the **"📷 Scan QR"** button
2. Grant camera permission if prompted
3. Point your camera at the QR code
4. The account will be added automatically

### Using Generated Codes

1. Each account card displays:
   - Service name (issuer)
   - Account name
   - Current TOTP code
   - Progress bar and countdown timer
2. Tap any code to copy it to clipboard
3. The code refreshes automatically when the timer expires

### Deleting an Account

1. Tap the **✕** button on any account card
2. Confirm the deletion

## Technical Details

### Architecture

- **React Native + Expo**: Cross-platform mobile development
- **TypeScript**: Type-safe code
- **React Navigation**: Screen navigation
- **AsyncStorage**: Persistent local storage
- **Expo Camera**: QR code scanning
- **Custom TOTP Implementation**: RFC 6238 compliant

### Key Components

- **AccountCard**: Displays account with live TOTP code
- **AddAccountModal**: Manual account entry form
- **HomeScreen**: Main account list view
- **ScanQRScreen**: QR code scanner with camera overlay

### TOTP Algorithm

Implements RFC 6238 Time-Based One-Time Password:
- HMAC-SHA1 based
- Base32 secret key encoding
- Configurable time step (default 30s)
- Configurable code length (6-8 digits)

## Project Structure

```
authentication-app/
├── App.tsx                 # Main app entry point
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
├── tsconfig.json         # TypeScript configuration
├── components/
│   ├── AccountCard.tsx        # Account display component
│   └── AddAccountModal.tsx    # Account entry modal
├── screens/
│   ├── HomeScreen.tsx         # Main screen
│   └── ScanQRScreen.tsx       # QR scanner screen
├── navigation/
│   └── types.ts              # Navigation types
├── utils/
│   ├── totp.ts              # TOTP generation logic
│   └── storage.ts           # Data persistence
└── types/
    └── index.ts            # TypeScript interfaces
```

## Dependencies

- **expo**: ~51.0.0
- **react-native**: 0.74.5
- **@react-navigation/native**: ^6.1.9
- **@react-navigation/native-stack**: ^6.9.17
- **@react-native-async-storage/async-storage**: 1.23.1
- **expo-barcode-scanner**: ~13.0.1
- **expo-camera**: ~15.0.10
- **expo-crypto**: ~13.0.2
- **expo-clipboard**: ~6.0.3

## Security Considerations

- Secrets are stored locally on the device
- No network communication (fully offline)
- Secrets never leave the device
- Use secure storage in production (consider expo-secure-store)

## Future Enhancements

- Biometric authentication lock
- Encrypted backup/restore
- Account icons from service providers
- Search and filter accounts
- Export/import functionality
- Cloud sync (optional)

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository.
