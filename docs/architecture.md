# Architecture

The app keeps its UI and backend access separate while sharing one product flow across web and native.

## Layers

- `src/application/AppRoot.js` selects the app's loading, profile setup, and radio dashboard states.
- `src/features` owns each feature's UI and state. Feature-local `data` modules adapt private device storage; shared Firebase adapters live in `src/shared/data`.
- `src/features/radio/audio` isolates microphone capture behind platform-specific Expo module resolution (`.web.js` and `.native.js`). The radio feature owns recording limits and publishing; capture adapters only acquire and release microphone resources.
- `src/shared/domain` holds small pure rules such as distance and timestamp conversion.
- `src/shared/data` adapts Firebase collections and Storage operations to feature use cases.
- `services/firebaseConfig.js` owns Firebase initialization and guest authentication.
- `components/MapView.js` and `components/MapView.web.js` isolate platform-specific maps.

## Data flow

1. Firebase Anonymous Auth supplies a stable UID; the nickname and avatar stay on device.
2. A recording is written to Storage first. Firestore receives a small metadata document only after upload succeeds.
3. The app subscribes to a bounded Firestore feed and queue. Realtime listeners are released when their feature unmounts. Web and native audio playback use the APIs provided by Expo Audio and browser audio respectively.
4. Location permission is requested only after the user asks to center the map. Coordinates are attached to radio messages and queue presence.

Platform adapters expose the same capture contract to feature hooks. Browser APIs stay out of native bundles, while Expo Audio and native file access stay out of the web implementation.

Shared feed data can be read by signed-in guests, but write and delete rules are scoped to the authenticated UID. Old shared-feed cleanup is intentionally not performed by an ordinary client.
