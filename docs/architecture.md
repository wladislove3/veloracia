# Architecture

The app keeps its UI and backend access separate while sharing one product flow across web and native.

## Layers

- `src/application/AppRoot.js` selects the app's loading, profile setup, and radio dashboard states.
- `src/features` owns each feature's UI, state, data adapters, and domain policy. Radio Firestore adapters and its device cache stay inside the radio feature.
- `src/features/radio/audio` isolates recording and playback behind platform-specific Expo module resolution (`.web.js` and `.native.js`). The radio feature owns recording limits and publishing; audio adapters only acquire, play, and release media resources.
- `src/features/location/platform` adapts browser geolocation and Expo Location to one location feature interface.
- `src/features/radio/domain` owns radio limits and radius choices; `presentation` owns user-facing distance and time formatting.
- `src/shared/domain` holds small pure rules such as distance and timestamp conversion.
- `src/shared/infrastructure/firebase` owns Firebase initialization, platform-specific auth, Firestore, and Storage clients.
- `components/MapView.js` and `components/MapView.web.js` isolate platform-specific maps.

## Data flow

1. Firebase Anonymous Auth supplies a stable UID; the nickname and avatar stay on device.
2. A recording is written to Storage first. Firestore receives a small metadata document only after upload succeeds.
3. The app subscribes to a bounded Firestore feed and a 30-minute queue window. The queue listener refreshes at the window boundary so abandoned entries stop accumulating in long-running sessions. Realtime listeners are released when their feature unmounts.
4. Location permission is requested only after the user asks to center the map. Coordinates are attached to radio messages and queue presence.

Platform adapters expose the same audio contract to feature hooks. Browser APIs stay out of native bundles, while Expo Audio and native file access stay out of the web implementation.

Shared feed data can be read by signed-in guests, but write and delete rules are scoped to the authenticated UID. Old shared-feed cleanup is intentionally not performed by an ordinary client.
