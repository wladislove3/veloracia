# Architecture

The app keeps its UI and backend access separate while sharing one product flow across web and native.

## Layers

- `src/application/AppRoot.js` selects the app's loading, profile setup, and radio dashboard states.
- `src/features` owns each feature's UI, state, data adapters, and domain policy. Radio Firestore adapters and its device cache stay inside the radio feature.
- `src/features/profile/presentation` translates Firebase guest-session failures into actionable setup guidance; profile hooks keep provider-specific wording out of orchestration.
- `src/features/radio/audio` isolates recording and playback behind platform-specific Expo module resolution (`.web.js` and `.native.js`). The radio feature owns recording limits and publishing; audio adapters only acquire, play, and release media resources.
- `src/features/location/platform` adapts browser geolocation and Expo Location to one location feature interface; both adapters normalize failures before the location hook presents them.
- `src/features/radio/domain` owns radio limits and radius choices; `presentation` owns user-facing distance and time formatting.
- `src/features/radio/domain/radioFeed.js` and `radioQueue.js` select retained, nearby feed items and derive queue state as pure rules. React hooks coordinate subscriptions and actions; they do not own feed-selection policy.
- `src/features/radio/hooks` groups dashboard composition, feed and queue subscriptions, recording limits, and the push-to-talk session lifecycle.
- `src/shared/domain` holds small pure rules such as distance and timestamp conversion.
- `src/shared/infrastructure/firebase` owns Firebase initialization, platform-specific auth, Firestore, and Storage clients.
- `src/features/location/components/MapView.js` and `MapView.web.js` isolate native and web maps within the location feature.

## Data flow

1. Firebase Anonymous Auth supplies a stable UID; the nickname and avatar stay on device.
2. Platform recorders pass browser `Blob`s or native byte arrays directly to Storage, avoiding a base64 copy. Firestore receives a small metadata document only after the upload succeeds.
3. The app subscribes to a bounded Firestore feed and a 30-minute queue window. The queue listener refreshes at the window boundary so abandoned entries stop accumulating in long-running sessions. Realtime listeners are released when their feature unmounts.
4. Location permission is requested only after the user asks to center the map. Coordinates are attached to radio messages and queue presence.

Platform adapters expose the same audio contract to feature hooks. Browser APIs stay out of native bundles, while Expo Audio and native file access stay out of the web implementation.

Shared feed data can be read by signed-in guests, but write and delete rules are scoped to the authenticated UID. Old shared-feed cleanup is intentionally not performed by an ordinary client.
