import { StyleSheet } from 'react-native';
import { palette } from '../../../shared/ui/tokens';

export const pushToTalkStyles = StyleSheet.create({
  area: { alignItems: 'center', paddingVertical: 13, borderTopWidth: 1, borderTopColor: palette.line, marginTop: 5 },
  areaCompact: { paddingVertical: 6, marginTop: 0 },
  button: { width: 70, height: 70, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lime, shadowColor: palette.lime, shadowOpacity: 0.21, shadowRadius: 20, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  buttonCompact: { width: 56, height: 56, borderRadius: 20 },
  recording: { backgroundColor: palette.record, transform: [{ scale: 1.06 }] },
  pressed: { transform: [{ scale: 0.96 }] },
  blocked: { backgroundColor: palette.surfaceRaised, shadowOpacity: 0 },
  icon: { color: palette.ink, fontSize: 27, fontWeight: '900' },
  title: { color: palette.text, fontSize: 13, fontWeight: '800', marginTop: 9 },
  hint: { color: palette.textFaint, fontSize: 10, marginTop: 3 },
  recordingProgressTrack: { width: 148, height: 3, overflow: 'hidden', borderRadius: 2, backgroundColor: 'rgba(255,110,100,0.18)', marginTop: 9 },
  recordingProgressFill: { height: '100%', borderRadius: 2, backgroundColor: palette.record },
});
