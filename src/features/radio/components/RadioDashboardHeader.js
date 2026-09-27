import React from 'react';
import { Pressable, Text, View } from 'react-native';
import RadioStatusPill from './RadioStatusPill';
import { headerStyles as styles } from './RadioDashboardHeader.styles';

export default function RadioDashboardHeader({ profile, onChangeProfile, statusLabel, statusTone, showStatus }) {
  return (
    <View style={styles.container}>
      <View style={styles.brandLockup}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>V</Text></View>
        <View><Text style={styles.brandName}>veloracia</Text><Text style={styles.brandCaption}>ГОРОДСКОЕ РАДИО</Text></View>
      </View>
      <View style={styles.actions}>
        {showStatus ? <RadioStatusPill tone={statusTone}>{statusLabel}</RadioStatusPill> : null}
        <Pressable
          onPress={onChangeProfile}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Изменить профиль"
        >
          <Text>{profile.avatar}</Text>
        </Pressable>
      </View>
    </View>
  );
}
