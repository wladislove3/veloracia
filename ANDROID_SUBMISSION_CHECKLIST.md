# Veloraz Android App Store Submission Checklist

**Last Updated: November 10, 2025**

## Pre-Launch Verification (Before Building APK/AAB)

### Code Quality & Stability
- [x] All critical bugs fixed (React Hooks ordering, UUID for user IDs)
- [x] Error handling in playAudio (isMounted checks, file cleanup)
- [x] startRecording/stopRecording protected from undefined calls
- [x] Firebase credentials moved to environment variables (.env.local)
- [x] Network status working correctly (navigator.onLine fallback)
- [x] Audio recording rate-limited to 10/hour
- [x] Audio file size validated (<700KB, base64 <900KB)
- [x] Geolocation error handling with user alerts
- [x] Microphone permission checks with proper messaging
- [ ] Run `npm audit` and check for vulnerable dependencies
- [ ] Run `npx expo lint` or equivalent
- [ ] Test on actual Android device (not just emulator)

### Permissions & Security
- [x] Microphone permission requested with description
- [x] Location permission requested with description
- [ ] Ensure geolocation only used when permission granted
- [ ] Verify no sensitive data logged to console in production build
- [ ] Check that .env.local is in .gitignore (not committed)
- [ ] Review Firebase Security Rules (Firestore) for public access

### Assets & Branding
- [ ] App icon (512x512 PNG, no transparency for rounded corners)
- [ ] Splash screen image (high quality, correct aspect ratio)
- [ ] Adaptive icon foreground (108x108 dp minimum, safe zone 72x72 dp)
- [ ] Verify all assets are in `./assets/` directory
- [ ] App name does not use reserved words ("Android", "Google", etc.)

### App Metadata
- [x] App name: "veloraz-demo" (can change to "Veloraz" for store)
- [x] Package name: "com.wladislove.velorazdemo"
- [x] Version code: 1 (increment for each Play Store release)
- [x] Version name: "1.0.0" (user-facing version)
- [x] Min SDK: 24 (Android 7.0)
- [x] Target SDK: 34 (Android 14)
- [ ] Update app.json with production values

### Documentation
- [x] Privacy Policy created (PRIVACY_POLICY.md)
- [x] Terms of Service created (TERMS_OF_SERVICE.md)
- [ ] Create privacy policy URL or host on website
- [ ] Create terms of service URL or host on website
- [ ] Create support email or contact form
- [ ] Create app description (2-4 sentences) for store listing
- [ ] Create app screenshots (minimum 2, maximum 8)

### Firebase Setup for Production
- [ ] Verify Firestore database is in production mode (not test)
- [ ] Review and tighten Firestore security rules:
  ```
  // Example: Only allow reads/writes by authenticated users
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /radioMessages/{document=**} {
        allow read, write: if request.auth != null;
      }
      match /radioQueue/{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```
- [ ] Set up Firebase backups (automatic retention policy)
- [ ] Enable Firebase monitoring/logging for production issues

### Testing Checklist
**Core Functionality:**
- [ ] Can login and set display name + avatar
- [ ] Can request geolocation permission and see map
- [ ] Can grant microphone permission
- [ ] Can join the radio queue
- [ ] Can record and send voice message
- [ ] Audio message appears in queue
- [ ] Can click and play another user's message
- [ ] Audio plays without errors
- [ ] Can leave the radio queue
- [ ] Can deny permissions and see fallback UI

**Edge Cases:**
- [ ] Deny geolocation → see error message with retry option
- [ ] Deny microphone → see error message, button disabled
- [ ] GPS off → see "Check GPS" message
- [ ] Airplane mode on → see network status indicator
- [ ] Record >10 messages in 1 hour → blocked with time until reset
- [ ] Record very short message (<200ms) → handled gracefully
- [ ] Record message at 700KB limit → accepted
- [ ] Record message at >700KB → rejected with error
- [ ] Logout → user ID reset, profile cleared
- [ ] Force stop app → no crashes on restart

**Performance:**
- [ ] App launches within 3 seconds
- [ ] Map loads without lag
- [ ] Audio playback starts within 2 seconds
- [ ] No memory leaks during prolonged use

## Building APK/AAB for Play Store

### Step 1: Prepare Environment
```bash
# Ensure all dependencies are installed
npm install

# Clean any previous builds
npx expo prebuild --clean
```

### Step 2: Configure Production Credentials
```bash
# Ensure .env.local has correct Firebase credentials
# DO NOT commit .env.local to git
echo ".env.local" >> .gitignore

# Verify credentials are loaded
npx expo start --tunnel
```

### Step 3: Create Signed APK or AAB
```bash
# Option A: Using Expo (Recommended for first submission)
eas build --platform android --non-interactive

# Option B: Manual local build
npx expo prebuild
cd android
./gradlew bundleRelease
```

### Step 4: Get Signing Certificate
- [ ] Create or upload signing certificate to Play Console
- [ ] Keep keystore file safe (required for future updates)
- [ ] Note: You CANNOT change signing certificate after first release!

## Google Play Store Submission

### Step 1: Create Play Store Account
- [ ] Go to https://play.google.com/console
- [ ] Sign in with Google Developer account
- [ ] Pay $25 one-time developer fee (if not already paid)

### Step 2: Create App on Play Store
- [ ] Click "Create app"
- [ ] App name: "Veloraz" or "Veloraz - Radio Voice Chat"
- [ ] Default language: English (or your preference)
- [ ] App type: Free
- [ ] Category: Communication or Social
- [ ] Content rating: PEGI 3 (no adult content)

### Step 3: Fill Store Listing
**Store Presence:**
- [ ] App name (50 characters max)
- [ ] Short description (80 characters max)
- [ ] Full description (4000 characters max)
- [ ] Screenshots (minimum 2, size 1080x1920px)
- [ ] Feature graphic (1024x500px)
- [ ] Promo graphic (180x120px)
- [ ] Icon (512x512px, PNG)

**Example Description:**
```
Veloraz is a location-based voice radio app. 
Connect with nearby users, share real-time location, 
and communicate through a shared radio queue. 
Perfect for team coordination, emergency response, 
or local community broadcasting.
```

**Categories:**
- Primary: Communication
- Secondary: Social (optional)

### Step 4: Content Rating Questionnaire
- [ ] Complete Google Play's content rating form
  - Violence: No
  - Sexual content: No
  - Profanity: No
  - Alcohol/tobacco: No
  - Gambling: No
  - User-generated content: Yes (voice messages)

### Step 5: Privacy & Permissions
- [ ] Add Privacy Policy URL
- [ ] Add Terms of Service URL (if different from privacy policy)
- [ ] Confirm data collection:
  - [x] Location data
  - [x] Audio data
  - [x] User profile data
  - [ ] Analytics (only if implemented)
  - [ ] Advertising (only if using ads)

**Permissions Disclosure:**
```
Microphone: Record voice messages for radio broadcasting
Location (Fine): Display user location on map
Location (Coarse): Fallback location data
```

### Step 6: App Signing
- [ ] Upload signed APK or AAB
- [ ] Google Play will verify signature
- [ ] You can use Google Play App Signing (recommended)

### Step 7: Release Configuration
- [ ] Min API level: 24 (Android 7.0)
- [ ] Target API level: 34 (Android 14)
- [ ] Max API level: None (always target latest)

### Step 8: Review & Submit
- [ ] Review all information
- [ ] Accept Google Play Developer Program Policies
- [ ] Accept Content Policies (no hate speech, violence, etc.)
- [ ] Confirm app doesn't contain prohibited content
- [ ] Submit for review

**Google Play Review typically takes 3-24 hours. You'll receive email notification.**

## Post-Launch

### Monitoring
- [ ] Set up Firebase Crashlytics for crash reporting
- [ ] Monitor Android Vitals dashboard
- [ ] Check user reviews and ratings
- [ ] Respond to user feedback

### Future Updates
- [ ] Increment versionCode and versionName in app.json
- [ ] Test thoroughly before resubmission
- [ ] Keep privacy policy and terms updated
- [ ] Plan features based on user feedback

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
npx expo prebuild --clean
npm install --force
```

### APK Signature Issues
```bash
# Verify keystore
keytool -list -v -keystore path/to/keystore.jks
```

### Firebase Connection Issues
```bash
# Verify .env variables are loaded
console.log(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID);
```

### App Crashes on Launch
- [ ] Check logcat for native errors: `adb logcat`
- [ ] Verify permissions are granted in AndroidManifest.xml
- [ ] Test with older Android versions (API 24-26)

## Final Checklist Before Submission

- [ ] All tests passed on physical device
- [ ] Privacy Policy hosted and URL accessible
- [ ] Terms of Service hosted and URL accessible
- [ ] Screenshot and icon assets uploaded
- [ ] Description and metadata filled in completely
- [ ] Firebase production rules verified
- [ ] Environment variables (.env.local) not committed to git
- [ ] Version code incremented
- [ ] APK/AAB uploaded and signed
- [ ] Content rating completed
- [ ] Developer account fees paid
- [ ] Ready for review submission

**Status:** ✅ Ready for Android submission after these steps

---

*For iOS, follow similar process on App Store Connect: https://appstoreconnect.apple.com*
