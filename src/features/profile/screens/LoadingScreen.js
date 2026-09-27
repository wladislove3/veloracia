import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../../shared/ui/tokens';

export function LoadingScreen() {
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={palette.lime} />
      <Text style={styles.label}>Включаем радио</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined, backgroundColor: palette.page, alignItems: 'center', justifyContent: 'center', gap: 12 },
  label: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
});
