# Authentication App

A comprehensive React Native authenticator app built with Expo that provides centralized authentication services for multiple applications.

## ✨ Features

### Core Authentication
- 🔐 **TOTP (Time-based OTP)** - Industry-standard 2FA codes
- 👆 **Biometric** - Fingerprint & Face ID support  
- 🔑 **Passkey** - WebAuthn/FIDO2 authentication
- 🔒 **Screen Lock** - Device security integration
- 🔢 **PIN** ⭐ NEW - Quick 4-6 digit authentication
- 🎨 **Pattern** ⭐ NEW - Visual pattern lock

### Centralized Authentication System ⭐ NEW
- 📱 **Multi-App Support** - Single authenticator for all your apps
- 🌐 **Backend API** - Complete RESTful API server
- 🗄️ **Database Management** - MySQL-backed authentication storage
- 🔐 **Advanced Security** - HMAC signatures, encryption, rate limiting
- 📊 **Audit Logging** - Comprehensive activity tracking
- ⚡ **Real-time Approval** - Push notifications and callbacks

### Account Management
- ✅ Add accounts via QR code scanning
- 🗂️ Organize multiple accounts
- 🎯 Quick access to TOTP codes
- ⚙️ Per-account settings and preferences

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

## 🚀 Backend API Setup ⭐ NEW

### Prerequisites
- Node.js 14+
- MySQL 5.7+ or MariaDB 10.3+

### Quick Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with database credentials
npm run init-db
npm run dev
```

## 📚 Documentation

### Quick Reference
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Commands and common tasks
- **[UPDATES.md](./UPDATES.md)** - What's new in v2.0

### Implementation Guides
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[COMPLETION_SUMMARY.md](./COMPLETION_SUMMARY.md)** - Implementation details

### API & Integration
- **[REQUIREMENTS_FOR_AUTHENTICATOR.md](./REQUIREMENTS_FOR_AUTHENTICATOR.md)** - API specs
- **[backend/README.md](./backend/README.md)** - Backend API docs

## 🎉 Version 2.0 Features

✨ **Backend API** - Complete centralized auth system  
✨ **Database** - MySQL with 5 tables  
✨ **PIN Auth** - 4-6 digit numeric authentication  
✨ **Pattern Lock** - Visual pattern authentication  
✨ **Multi-App** - Support multiple connected apps  
✨ **Security** - HMAC, encryption, rate limiting, audit logging  

**Status**: Production Ready ✅

---
**Version**: 2.0.0 | **Updated**: December 28, 2025
# CI/CD Ready
