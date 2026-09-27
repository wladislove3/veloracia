import React from 'react';
import { Text, View } from 'react-native';
import { statusPillStyles as styles } from './radioStatusPill.styles';

export default function RadioStatusPill({ children, tone = 'neutral' }) {
  return (
    <View style={[styles.container, tone === 'live' && styles.live, tone === 'warning' && styles.warning]}>
      {tone === 'live' ? <View style={styles.dot} /> : null}
      <Text style={[styles.text, tone === 'live' && styles.liveText]}>{children}</Text>
    </View>
  );
}
