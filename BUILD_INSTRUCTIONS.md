# Building APK for Authenticator App

## Prerequisites
Your project has been prepared for building. The native Android files have been generated in the `android` folder.

## Option 1: Build with EAS Build (Cloud) - **RECOMMENDED**

This is the easiest method and doesn't require local Android SDK installation.

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Build the APK**:
   ```bash
   eas build --platform android --profile production
   ```

   The APK will be built in the cloud and you'll get a download link when it's ready.

## Option 2: Build Locally

This requires Android Studio and Android SDK to be installed.

### Setup Android SDK

1. **Install Android Studio** from https://developer.android.com/studio

2. **Set ANDROID_HOME environment variable**:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3. **Reload your shell**:
   ```bash
   source ~/.bashrc  # or source ~/.zshrc
   ```

### Build the APK

```bash
cd /home/tniglobal/public_html/app/authentication-app/android
./gradlew assembleRelease
```

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Option 3: Use Expo Go (Development Only)

For development and testing:
```bash
npm start
```
Then scan the QR code with Expo Go app on your Android device.

## Current Status

✅ Native Android files generated successfully
✅ Project structure ready for building
✅ EAS configuration file created (`eas.json`)
✅ Export bundle created in `dist` folder

⚠️ Local build requires Android SDK to be installed
✅ Cloud build with EAS is ready to use

## Recommended Next Steps

1. Use **EAS Build** for the easiest experience
2. Run: `eas build --platform android --profile production`
3. Download the APK when build completes
4. Install on your Android device

## Build Profiles (eas.json)

- **development**: Development build with development client
- **preview**: Internal distribution APK (for testing)
- **production**: Production APK (ready for distribution)

To use a specific profile:
```bash
eas build --platform android --profile preview  # For testing
eas build --platform android --profile production  # For release
```
