import { StyleSheet } from 'react-native';
import { palette, radii } from '../../../shared/ui/tokens';

export const voiceMessageStyles = StyleSheet.create({
  card: { minHeight: 62, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: palette.surfaceRaised, borderRadius: radii.md, borderWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 10 },
  playing: { borderColor: 'rgba(206,255,87,0.52)', backgroundColor: palette.limeWash },
  avatar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderRadius: 14, fontSize: 19 },
  copy: { flex: 1, minWidth: 0 },
  name: { color: palette.text, fontSize: 12, fontWeight: '800' },
  meta: { color: palette.textFaint, fontSize: 10, marginTop: 4 },
  playButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: palette.surface, color: palette.textMuted },
  playButtonActive: { backgroundColor: palette.lime },
  playButtonText: { color: palette.text, fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.82 },
});
