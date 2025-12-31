import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HowToScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🛡️</Text>
        <Text style={styles.headerTitle}>Authenticator App</Text>
        <Text style={styles.headerSubtitle}>Your Digital Security Guardian</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* What is an Authenticator App */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔐</Text>
            <Text style={styles.sectionTitle}>What is an Authenticator App?</Text>
          </View>
          <Text style={styles.text}>
            An authenticator app is a secure application that generates time-based one-time passwords (TOTP) 
            to verify your identity when logging into your accounts. It adds an extra layer of security beyond 
            just your username and password.
          </Text>
        </View>

        {/* Why Use It */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✨</Text>
            <Text style={styles.sectionTitle}>Why Use Two-Factor Authentication?</Text>
          </View>
          <View style={styles.benefitsList}>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>🔒</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Enhanced Security</Text>
                <Text style={styles.benefitText}>
                  Even if someone gets your password, they can't access your account without the second factor
                </Text>
              </View>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>⚡</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Quick & Easy</Text>
                <Text style={styles.benefitText}>
                  Generate secure codes instantly without waiting for SMS messages
                </Text>
              </View>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>📱</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Works Offline</Text>
                <Text style={styles.benefitText}>
                  No internet connection needed to generate authentication codes
                </Text>
              </View>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.benefitIcon}>🌐</Text>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Universal</Text>
                <Text style={styles.benefitText}>
                  Works with thousands of services including Google, Facebook, GitHub, and more
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚙️</Text>
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Scan QR Code</Text>
                <Text style={styles.stepText}>
                  When setting up 2FA on a service, scan the provided QR code with the app
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Account Added</Text>
                <Text style={styles.stepText}>
                  The service is now linked to your authenticator app
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Generate Codes</Text>
                <Text style={styles.stepText}>
                  The app generates a new 6-digit code every 30 seconds
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Enter Code</Text>
                <Text style={styles.stepText}>
                  When logging in, enter the current code from the app to verify your identity
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Features Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🌟</Text>
            <Text style={styles.sectionTitle}>Key Features</Text>
          </View>
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📷</Text>
              <Text style={styles.featureTitle}>QR Scan</Text>
              <Text style={styles.featureText}>Quick setup by scanning QR codes</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>✍️</Text>
              <Text style={styles.featureTitle}>Manual Entry</Text>
              <Text style={styles.featureText}>Add accounts manually if needed</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🔔</Text>
              <Text style={styles.featureTitle}>Push Notifications</Text>
              <Text style={styles.featureText}>Approve logins with one tap</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🔐</Text>
              <Text style={styles.featureTitle}>App Lock</Text>
              <Text style={styles.featureText}>Secure with PIN, pattern, or biometrics</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>⏱️</Text>
              <Text style={styles.featureTitle}>Auto-Lock</Text>
              <Text style={styles.featureText}>Lock automatically when inactive</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>📋</Text>
              <Text style={styles.featureTitle}>Code Copy</Text>
              <Text style={styles.featureText}>One-tap copy to clipboard</Text>
            </View>
          </View>
        </View>

        {/* Security Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔑</Text>
            <Text style={styles.sectionTitle}>Security Options</Text>
          </View>
          <View style={styles.securityOptions}>
            <View style={styles.securityOption}>
              <View style={styles.securityIconBg}>
                <Text style={styles.securityOptionIcon}>🔢</Text>
              </View>
              <View style={styles.securityOptionContent}>
                <Text style={styles.securityOptionTitle}>PIN Code</Text>
                <Text style={styles.securityOptionText}>
                  Set a 4-6 digit PIN to protect your authenticator
                </Text>
              </View>
            </View>
            <View style={styles.securityOption}>
              <View style={[styles.securityIconBg, styles.greenBg]}>
                <Text style={styles.securityOptionIcon}>🔲</Text>
              </View>
              <View style={styles.securityOptionContent}>
                <Text style={styles.securityOptionTitle}>Pattern Lock</Text>
                <Text style={styles.securityOptionText}>
                  Draw a pattern on a 3x3 grid for quick access
                </Text>
              </View>
            </View>
            <View style={styles.securityOption}>
              <View style={[styles.securityIconBg, styles.redBg]}>
                <Text style={styles.securityOptionIcon}>👆</Text>
              </View>
              <View style={styles.securityOptionContent}>
                <Text style={styles.securityOptionTitle}>Biometric</Text>
                <Text style={styles.securityOptionText}>
                  Use fingerprint or face recognition for instant unlock
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Push Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📲</Text>
            <Text style={styles.sectionTitle}>Push Notification Approvals</Text>
          </View>
          <Text style={styles.text}>
            For supported services, you can approve login attempts directly from push notifications 
            without opening the app or typing codes. Simply tap "Approve" when you receive a notification 
            for a login attempt.
          </Text>
          <View style={styles.pushFeatures}>
            <View style={styles.pushFeature}>
              <Text style={styles.pushFeatureIcon}>⚡</Text>
              <Text style={styles.pushFeatureText}>Instant approvals</Text>
            </View>
            <View style={styles.pushFeature}>
              <Text style={styles.pushFeatureIcon}>🔒</Text>
              <Text style={styles.pushFeatureText}>Secure verification</Text>
            </View>
            <View style={styles.pushFeature}>
              <Text style={styles.pushFeatureIcon}>📍</Text>
              <Text style={styles.pushFeatureText}>See login details</Text>
            </View>
          </View>
        </View>

        {/* Getting Started */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🚀</Text>
            <Text style={styles.sectionTitle}>Getting Started</Text>
          </View>
          <View style={styles.gettingStarted}>
            <Text style={styles.gettingStartedText}>
              1. Tap the <Text style={styles.bold}>Scan QR</Text> button on the home screen
            </Text>
            <Text style={styles.gettingStartedText}>
              2. Scan the QR code provided by the service you want to secure
            </Text>
            <Text style={styles.gettingStartedText}>
              3. Your account will be added and codes will start generating
            </Text>
            <Text style={styles.gettingStartedText}>
              4. Use the generated codes when logging in to verify your identity
            </Text>
          </View>
          <View style={styles.tipBox}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Tip: Keep your phone secure and never share your authentication codes with anyone!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4dabf7',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lastSection: {
    marginBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
  },
  benefitsList: {
    marginTop: 10,
  },
  benefit: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  stepsList: {
    marginTop: 10,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4dabf7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  featureCard: {
    width: (width - 72) / 2,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  securityOptions: {
    marginTop: 10,
  },
  securityOption: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  securityIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4dabf7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greenBg: {
    backgroundColor: '#51cf66',
  },
  redBg: {
    backgroundColor: '#ff6b6b',
  },
  securityOptionIcon: {
    fontSize: 24,
  },
  securityOptionContent: {
    flex: 1,
  },
  securityOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  securityOptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pushFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  pushFeature: {
    alignItems: 'center',
  },
  pushFeatureIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  pushFeatureText: {
    fontSize: 12,
    color: '#666',
  },
  gettingStarted: {
    marginTop: 10,
  },
  gettingStartedText: {
    fontSize: 15,
    lineHeight: 26,
    color: '#555',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#4dabf7',
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#856404',
  },
});
