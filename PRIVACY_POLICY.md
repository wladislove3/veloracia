# Veloracia privacy notice

**Last updated: 27 September 2026**

Veloracia is a location-based voice radio for web and mobile. This notice describes the data handled by the current application.

## Data the app uses

- **Guest identity:** Firebase Anonymous Authentication creates a UID. Your nickname and emoji avatar are saved on your device.
- **Location:** the app asks for location only when you choose the map location control. Coordinates can be attached to a voice message or queue entry. They are visible to other signed-in Veloracia guests so the nearby radio can work. The app does not request background location.
- **Voice messages:** when you release the talk button, the recording is uploaded to Firebase Storage. A Firestore record contains its storage path, nickname, avatar, timestamp, and location when available.
- **Queue presence:** while you join the radio queue, Firestore stores your UID, nickname, avatar, location when available, and queue time.
- **Local cache:** the app saves your profile and a small cache of recent message metadata on your device.

The app does not request your phone number, email address, contacts, or advertising identifier.

## How data is used and shared

Firebase processes authentication, message metadata, queue state, and audio files. Signed-in Veloracia guests can read the shared radio feed and listen to its messages. The interactive map loads map tiles from its map providers, which may receive the network and viewport information needed to serve those tiles. Data is not used by the app for advertising.

## Retention and deletion

The interface filters older messages from the nearby feed, but that filter does not delete their Firestore records or audio files. The current app has no self-service control to delete a sent message or guest account. Clearing the local app data removes local profile/cache data and may end access to the guest identity; it does not remove messages already sent. Contact details for data requests must be supplied by the service operator before public release.

## Your choices

- You can decline location permission. The map can still open, but nearby filtering and location sharing will be unavailable.
- You can deny microphone permission. Recording and sending voice messages will be unavailable.
- You can change your nickname and avatar from the profile control.

## Security

Firestore and Storage rules in this repository scope writes to the authenticated guest UID. Those rules take effect only after Anonymous Authentication is enabled in Firebase and the rules are deployed. Data is sent over HTTPS. No online service can guarantee absolute security.

## Operator information

The repository does not include the service operator's legal name, address, jurisdiction, or a working privacy contact. Add those details before publishing this notice as a legal policy.
