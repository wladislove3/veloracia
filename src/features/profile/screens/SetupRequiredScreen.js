import { Linking, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, radii, shadows, spacing } from '../../../shared/ui/tokens';
import { getGuestSessionError } from '../presentation/guestSessionError';

const waveformHeights = [12, 20, 31, 18, 39, 25, 46, 29, 17, 35, 22, 42, 14, 28, 19, 34, 12];

export function SetupRequiredScreen({ error, onRetry }) {
  const details = getGuestSessionError(error);
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.orbitOne} />
          <View style={styles.orbitTwo} />
          <View style={styles.brand}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>V</Text></View>
            <View><Text style={styles.brandName}>veloracia</Text><Text style={styles.brandCaption}>ГОРОДСКОЕ РАДИО</Text></View>
            <View style={styles.signal}><View style={styles.liveDot} /><Text style={styles.signalText}>СВЯЗЬ НЕ УСТАНОВЛЕНА</Text></View>
          </View>
          <View style={styles.waveform} accessibilityElementsHidden>
            {waveformHeights.map((bar, index) => <View key={index} style={[styles.waveformBar, { height: bar }]} />)}
          </View>
          <Text style={styles.eyebrow}>НУЖНА НАСТРОЙКА</Text>
          <Text style={styles.title}>{details.title}</Text>
          <Text style={styles.message}>{details.message}</Text>
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>01</Text>
            <Text style={styles.instructionText}>{details.instruction}</Text>
          </View>
          <Pressable onPress={onRetry} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Попробовать снова <Text>↗</Text></Text>
          </Pressable>
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(details.settingsUrl).catch(() => undefined)} style={styles.settingsLink}>
            <Text style={styles.settingsText}>{details.settingsLabel}</Text>
            <Text style={styles.settingsArrow}>↗</Text>
          </Pressable>
          {details.code ? <Text selectable style={styles.errorCode}>Код ошибки · {details.code}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined, backgroundColor: palette.page },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[5] },
  card: { width: '100%', maxWidth: 520, padding: 32, borderRadius: radii.xl, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, overflow: 'hidden', ...shadows.panel },
  orbitOne: { position: 'absolute', width: 300, height: 300, borderRadius: 150, borderWidth: 1, borderColor: 'rgba(206,255,87,0.09)', right: -205, top: 45 },
  orbitTwo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: 'rgba(206,255,87,0.07)', right: -165, top: 85 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 36 },
  brandMark: { width: 44, height: 44, borderRadius: 16, backgroundColor: palette.lime, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: palette.ink, fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  brandName: { color: palette.text, fontSize: 18, letterSpacing: -0.4, fontWeight: '900' },
  brandCaption: { color: palette.textFaint, fontSize: 9, letterSpacing: 1.6, marginTop: 4, fontWeight: '700' },
  signal: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 9, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: 'rgba(241,185,113,0.08)' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.lime },
  signalText: { color: palette.warning, fontSize: 8, fontWeight: '800', letterSpacing: 0.55 },
  waveform: { height: 38, flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 28 },
  waveformBar: { width: 3, backgroundColor: 'rgba(206,255,87,0.42)' },
  eyebrow: { color: palette.lime, fontWeight: '800', letterSpacing: 1.7, fontSize: 10 },
  title: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -1.4, marginTop: 10 },
  message: { color: palette.textMuted, fontSize: 14, lineHeight: 22, marginTop: 10, marginBottom: 22, maxWidth: 420 },
  instruction: { minHeight: 58, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surfaceRaised, borderWidth: 1, borderColor: palette.line, borderRadius: radii.sm },
  instructionNumber: { color: palette.lime, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  instructionText: { color: palette.text, flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  primaryButton: { minHeight: 52, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lime, marginTop: 16 },
  primaryButtonText: { color: palette.ink, fontSize: 14, fontWeight: '900', letterSpacing: 0.1 },
  pressed: { opacity: 0.82 },
  settingsLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingVertical: 14 },
  settingsText: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  settingsArrow: { color: palette.lime, fontSize: 13, fontWeight: '800' },
  errorCode: { color: palette.textFaint, fontSize: 10, textAlign: 'center', marginTop: 3 },
});
