import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export default function QueueIndicator({ currentSpeaker }) {
  const name = currentSpeaker?.nickname || currentSpeaker?.userId || 'Никого нет';
  const avatar = currentSpeaker?.avatar || '🎤';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>В эфире сейчас</Text>
      <View style={styles.row}>
        <Text style={styles.avatar}>{avatar}</Text>
        <Text style={styles.speaker}>{name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 180,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speaker: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    fontSize: 16,
  },
  avatar: {
    fontSize: 20,
  },
});