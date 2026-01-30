# Privacy Policy for Veloraz

**Last Updated: November 10, 2025**

## 1. Introduction

Veloraz ("the App") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

## 2. Information We Collect

### 2.1 Location Data
- **GPS Coordinates**: We collect your precise location (latitude, longitude) when you grant location permission. This is used to:
  - Display your position on the map
  - Show other users' recent locations (within the last 3 hours)
  - Provide local radio queue functionality

### 2.2 Audio Data
- **Voice Messages**: When you record and send voice messages, we store:
  - Base64-encoded audio data
  - Message timestamp
  - Your user ID and display name
  - Message location metadata

### 2.3 User Profile Information
- **Display Name**: Your chosen nickname or username
- **Avatar**: Your selected emoji avatar
- **User ID**: A unique identifier (UUID-based)

### 2.4 Device & Technical Data
We do NOT collect:
- Device IMEI or unique device identifiers
- Phone number
- Email address
- Personal contact information

## 3. Data Storage

### 3.1 Cloud Storage
All user data (audio messages, locations, profiles) is stored in:
- **Google Firebase Firestore** (cloud database)
- Location: US (as per Firebase default)

### 3.2 Local Storage
- User ID and profile preferences are stored locally on your device
- Audio cache is automatically cleaned up periodically

### 3.3 Data Retention
- Voice messages are retained indefinitely in the database
- Location data is displayed for up to 3 hours, then archived
- Users can delete their account by clearing app data

## 4. Data Usage

We use your data exclusively for:
- Real-time voice radio communication
- Map-based location display
- Queue management for radio speakers
- App functionality and user experience improvement

**We do NOT:**
- Sell your data to third parties
- Use data for advertising or marketing
- Share data with advertisers or analytics companies
- Track you outside the app

## 5. Third-Party Services

### 5.1 Firebase (Google Cloud)
- Stores messages and user profiles
- [Google Privacy Policy](https://policies.google.com/privacy)

### 5.2 Google Maps API
- Displays the interactive map
- [Google Maps Privacy Policy](https://policies.google.com/privacy)

### 5.3 Expo (React Native Backend)
- App distribution and updates
- [Expo Privacy Policy](https://expo.dev/privacy)

## 6. User Rights

### 6.1 Access Your Data
You can request all data we hold about you by contacting support.

### 6.2 Delete Your Data
- Clear app local storage: Go to device settings → Apps → Veloraz → Storage → Clear Data
- This deletes your user ID and profile
- Messages you sent remain in the database (cannot be retroactively deleted)

### 6.3 Opt-Out of Location Sharing
- Deny location permission in device settings
- App will notify you that map features are unavailable

## 7. Permissions

The app requests the following device permissions:

| Permission | Purpose | Required? |
|-----------|---------|-----------|
| **Microphone** | Record voice messages | Yes |
| **Location (Fine)** | Get precise GPS coordinates | Yes |
| **Location (Coarse)** | Fallback location data | No |

## 8. Security

We implement:
- HTTPS encryption for all data in transit
- Firebase security rules to restrict unauthorized access
- No passwords stored (anonymous authentication via UUID)
- Regular security audits

**Note:** No system is 100% secure. We cannot guarantee absolute security of your data.

## 9. Children's Privacy

This app is **not intended for children under 13**. We do not knowingly collect information from children. If we become aware of data from a child under 13, we will delete it immediately.

## 10. Changes to This Policy

We may update this Privacy Policy as the app evolves. We will notify users of material changes via app notification or email if applicable.

## 11. Contact Us

If you have questions about this Privacy Policy or our practices, contact us:

**Email:** support@veloraz.app
**Address:** [Your Company Address]

---

By using Veloraz, you agree to this Privacy Policy.
