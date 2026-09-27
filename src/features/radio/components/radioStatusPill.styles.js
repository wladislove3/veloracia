import { StyleSheet } from 'react-native';
import { palette, radii } from '../../../shared/ui/tokens';

export const statusPillStyles = StyleSheet.create({
  container: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: palette.surfaceRaised, flexDirection: 'row', alignItems: 'center', gap: 7 },
  live: { backgroundColor: palette.limeWash },
  warning: { backgroundColor: palette.surfaceRaised },
  text: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  liveText: { color: palette.lime },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.lime },
});
