# Firebase setup

Veloracia uses the Firebase Web SDK on web and native. The public client configuration for `veloracia-e93c7` is the default in `src/shared/infrastructure/firebase/firebaseApp.js`. Environment values are ignored unless `EXPO_PUBLIC_FIREBASE_USE_ENV_CONFIG=true` is set, which prevents stale Vercel variables from silently overriding the working project configuration. Firebase client configuration is public by design. Protect application data with Firebase Security Rules and restrict the API key to Firebase APIs.

The repository's Firebase CLI default project is `veloracia-e93c7`.

## Configuration

The repository defaults to the Firebase Web App configuration for `veloracia-e93c7`, so local and Vercel builds need no Firebase environment variables. To intentionally target a different Firebase app or project, set `EXPO_PUBLIC_FIREBASE_USE_ENV_CONFIG=true` and provide all six current `EXPO_PUBLIC_FIREBASE_*` values. Partial overrides are ignored to prevent mixed project configuration.

For Android native builds, add `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` from a Maps SDK for Android key restricted to this app's package and signing certificate. Expo reads it through `app.config.js`. The web map uses CARTO/OpenStreetMap tiles and does not need this key. No Google Maps key is committed to the repository.

## Anonymous guest identity

The app uses Firebase Anonymous Authentication to assign a stable guest UID. In Firebase Console, open **Authentication → Sign-in method**, enable **Anonymous**, then deploy the rules in this repository:

```bash
firebase login
firebase deploy --project default --only firestore:rules,firestore:indexes,storage
```

The active Firebase project should match `EXPO_PUBLIC_FIREBASE_PROJECT_ID`. Firestore permits authenticated guests to read the public radio feed; each guest can create and delete only their own messages and queue entry. Storage audio is readable to authenticated guests and writable only under that guest's UID.

The rules deliberately remove unauthenticated public writes. Existing clients that use a locally generated user ID must upgrade before these rules are deployed.

## Audio and retention

New recordings are uploaded to `radioMessages/{uid}/{messageId}` in Firebase Storage. Firestore keeps only their metadata and the Storage path. The client reads at most 100 recent messages and filters visible messages by location and age. The rate-limit lookup uses the `radioMessages(userId, createdAt)` composite index in `firestore.indexes.json`. Deploy it with the rules. The app does not delete shared records as part of normal startup.

Legacy messages that stored base64 audio directly in Firestore remain playable while they are still returned by the feed. Do not run bulk deletion scripts against production data.
