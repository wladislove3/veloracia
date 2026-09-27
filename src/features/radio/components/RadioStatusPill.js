import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../radioDashboard.styles';

export default function RadioStatusPill({ children, tone = 'neutral' }) {
  return (
    <View style={[styles.statusPill, tone === 'live' && styles.statusPillLive, tone === 'warning' && styles.statusPillWarning]}>
      {tone === 'live' ? <View style={styles.statusDot} /> : null}
      <Text style={[styles.statusPillText, tone === 'live' && styles.statusPillTextLive]}>{children}</Text>
    </View>
  );
}
