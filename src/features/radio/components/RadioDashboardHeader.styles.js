import { StyleSheet } from 'react-native';
import { palette, spacing } from '../../../shared/ui/tokens';

export const headerStyles = StyleSheet.create({
  container: { minHeight: 76, paddingHorizontal: spacing[6], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: palette.line },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  brandMark: { width: 38, height: 38, borderRadius: 14, backgroundColor: palette.lime, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: palette.ink, fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  brandName: { color: palette.text, fontSize: 17, letterSpacing: -0.5, fontWeight: '800' },
  brandCaption: { color: palette.textFaint, fontSize: 9, letterSpacing: 1.7, marginTop: 3, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  avatar: { width: 40, height: 40, borderRadius: 15, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, fontSize: 20 },
  pressed: { opacity: 0.82 },
});
