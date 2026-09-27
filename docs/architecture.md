# Architecture

The app keeps its UI and backend access separate while sharing one product flow across web and native.

## Layers

- `src/application` composes the session, location, radio state, and responsive dashboard.
- `src/features` owns user-facing flows: guest profile, location permission, message feed, playback, recording, and queue state.
- `src/shared/domain` holds small pure rules such as distance and timestamp conversion.
- `src/shared/data` adapts Firebase collections and Storage operations to feature use cases.
- `services/firebaseConfig.js` owns Firebase initialization and guest authentication.
- `components/MapView.js` and `components/MapView.web.js` isolate platform-specific maps.

## Data flow

1. Firebase Anonymous Auth supplies a stable UID; the nickname and avatar stay on device.
2. A recording is written to Storage first. Firestore receives a small metadata document only after upload succeeds.
3. The app subscribes to a bounded Firestore feed and queue. Realtime listeners are released when their feature unmounts.
4. Location permission is requested only after the user asks to center the map. Coordinates are attached to radio messages and queue presence.

Shared feed data can be read by signed-in guests, but write and delete rules are scoped to the authenticated UID. Old shared-feed cleanup is intentionally not performed by an ordinary client.
