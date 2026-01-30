import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Marker } from './MapView';

import { theme } from '../utils/theme';

export default function UserMarker({ user, onCall }) {
  const [showPopup, setShowPopup] = useState(false);

  if (!user.location) return null;

  return (
    <>
      <Marker
        coordinate={user.location}
        onPress={() => setShowPopup(true)}
        title={user.nickname}
        description={user.avatar}
      >
        <View style={styles.markerColumn}>
          <Text style={styles.avatar}>{user.avatar || '🎤'}</Text>
          <Text style={styles.nicknameSmall}>{user.nickname || user.userId}</Text>
        </View>
      </Marker>
      <Modal
        visible={showPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPopup(false)}
      >
        <TouchableOpacity style={styles.overlay} onPress={() => setShowPopup(false)} activeOpacity={1}>
          <TouchableOpacity style={styles.popup} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.avatarLarge}>{user.avatar || '🎤'}</Text>
            <Text style={styles.nickname}>{user.nickname || user.userId}</Text>
            <TouchableOpacity style={styles.callBtn} onPress={() => { setShowPopup(false); onCall && onCall(user); }}>
              <Text style={styles.callText}>Приватный вызов</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  markerColumn: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    minHeight: 52,
    ...theme.shadow,
  },
  avatar: {
    fontSize: 26,
    marginBottom: 2,
  },
  nicknameSmall: {
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 0,
    maxWidth: 80,
    textAlign: 'center',
    fontFamily: theme.fonts.bodyBold,
    lineHeight: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 24, 28, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    minWidth: 200,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  avatarLarge: {
    fontSize: 52,
    marginBottom: 6,
  },
  nickname: {
    fontSize: 20,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 16,
  },
  callBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  callText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: theme.fonts.bodyBold,
  },
});