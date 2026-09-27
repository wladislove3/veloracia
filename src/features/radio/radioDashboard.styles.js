import { Platform, StyleSheet } from 'react-native';
import { palette, spacing } from '../../shared/ui/tokens';

export const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined, backgroundColor: palette.page, color: palette.text },
  layout: { flex: 1, flexDirection: 'row', padding: spacing[4], gap: spacing[4], minHeight: 0 },
  layoutMobile: { flexDirection: 'column', padding: spacing[3], gap: spacing[3] },
  layoutCompact: { gap: 8 },
});
