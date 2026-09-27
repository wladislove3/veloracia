import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { palette, radii, shadows, spacing } from '../../../shared/ui/tokens';
import { PROFILE_AVATARS } from '../domain/profile';

export function ProfileSetup({ onSave }) {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 820 && height >= 700;
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(PROFILE_AVATARS[0]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function submit() {
    if (isSaving) return;
    const cleanName = nickname.trim();
    if (!cleanName) {
      setError('Введите имя для эфира.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ nickname: cleanName, avatar });
    } catch {
      setError('Не получилось сохранить профиль. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.profileScreen}>
      <View style={[styles.profileCard, isWide && styles.profileCardWide]}>
        {isWide ? (
          <View style={styles.heroPanel}>
            <View style={styles.heroOrbitLarge} />
            <View style={styles.heroOrbitSmall} />
            <View style={styles.heroBrand}>
              <View style={[styles.brandMark, styles.heroBrandMark]}><Text style={styles.brandMarkText}>V</Text></View>
              <View><Text style={styles.heroBrandName}>veloracia</Text><Text style={styles.heroBrandCaption}>ГОРОДСКОЕ РАДИО</Text></View>
            </View>
            <View style={styles.heroMessage}>
              <Text style={styles.heroEyebrow}>ВАША ВОЛНА УЖЕ РЯДОМ</Text>
              <Text style={styles.heroTitle}>Город звучит ближе.</Text>
              <Text style={styles.heroCopy}>Услышать знакомую улицу. Подсказать дорогу. Поймать голоса тех, кто рядом.</Text>
              <View style={styles.waveform} accessibilityElementsHidden>
                {[18, 30, 22, 42, 27, 50, 24, 36, 19, 44, 27, 16, 34, 21, 40, 25].map((bar, index) => (
                  <View key={index} style={[styles.waveformBar, { height: bar }]} />
                ))}
              </View>
            </View>
            <View style={styles.heroFooter}><View style={styles.heroLiveDot} /><Text style={styles.heroFooterText}>ЛЮДИ ИЗ ВАШЕГО РАЙОНА</Text></View>
          </View>
        ) : null}

        <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
          {!isWide ? <View style={styles.brandMark}><Text style={styles.brandMarkText}>V</Text></View> : null}
          <Text style={styles.eyebrow}>{isWide ? 'ПЕРЕД ПЕРВЫМ ЭФИРОМ' : 'VELO · ЛОКАЛЬНЫЙ ЭФИР'}</Text>
          <Text style={[styles.profileTitle, isWide && styles.profileTitleWide]}>{isWide ? 'Как вас звать?' : 'Город звучит ближе.'}</Text>
          <Text style={styles.profileSubtitle}>{isWide ? 'Выберите позывной и знак — и присоединяйтесь к голосам рядом.' : 'Выберите имя — и слушайте голоса людей вокруг.'}</Text>
          <Text style={styles.inputLabel}>ВАШ ПОЗЫВНОЙ</Text>
          <TextInput
            accessibilityLabel="Ваш позывной"
            autoCapitalize="words"
            maxLength={20}
            onChangeText={(value) => { setNickname(value); setError(''); }}
            onSubmitEditing={submit}
            placeholder="Например, Лис"
            placeholderTextColor={palette.textFaint}
            returnKeyType="done"
            style={styles.nameInput}
            value={nickname}
          />
          <Text style={styles.inputLabel}>ВАШ ЗНАК</Text>
          <View style={[styles.avatarGrid, isWide && styles.avatarGridWide]}>
            {PROFILE_AVATARS.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`Аватар ${item}`}
                accessibilityState={{ selected: avatar === item }}
                onPress={() => setAvatar(item)}
                style={[styles.avatarChoice, isWide && styles.avatarChoiceWide, avatar === item && styles.avatarChoiceSelected]}
              >
                <Text style={styles.avatarChoiceText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
          <Pressable
            accessibilityState={{ disabled: isSaving, busy: isSaving }}
            disabled={isSaving}
            onPress={submit}
            style={({ pressed }) => [styles.primaryButton, (pressed || isSaving) && styles.pressed]}
          >
            {isSaving ? <ActivityIndicator color={palette.ink} /> : <Text style={styles.primaryButtonText}>Войти в эфир <Text>↗</Text></Text>}
          </Pressable>
          <Text style={styles.privacyNote}>Без телефона и регистрации. Только ваш голос и район.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function SetupRequired({ message, onRetry }) {
  return (
    <SafeAreaView style={styles.profileScreen}>
      <View style={styles.profileCard}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>V</Text></View>
        <Text style={styles.eyebrow}>НУЖНА НАСТРОЙКА</Text>
        <Text style={styles.profileTitle}>Почти на частоте.</Text>
        <Text style={styles.profileSubtitle}>{message}</Text>
        <Pressable onPress={onRetry} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>Попробовать снова ↗</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={palette.lime} />
      <Text style={styles.loadingLabel}>Включаем радио</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandMark: { width: 60, height: 60, borderRadius: 22, backgroundColor: palette.lime, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[7] },
  profileScreen: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined, backgroundColor: palette.page, justifyContent: 'center', alignItems: 'center', padding: spacing[5] },
  profileCard: { width: '100%', maxWidth: 430, padding: spacing[7], borderRadius: radii.xl, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, ...shadows.panel },
  profileCardWide: { maxWidth: 980, padding: 0, flexDirection: 'row', overflow: 'hidden' },
  heroPanel: { flex: 1, minHeight: 590, padding: 42, justifyContent: 'space-between', overflow: 'hidden', backgroundColor: '#1A211D', borderRightWidth: 1, borderRightColor: palette.line },
  heroOrbitLarge: { position: 'absolute', width: 430, height: 430, borderRadius: 215, borderWidth: 1, borderColor: 'rgba(206,255,87,0.12)', right: -205, top: 105 },
  heroOrbitSmall: { position: 'absolute', width: 310, height: 310, borderRadius: 155, borderWidth: 1, borderColor: 'rgba(206,255,87,0.11)', right: -145, top: 165 },
  heroBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroBrandMark: { marginBottom: 0 },
  heroBrandName: { color: palette.text, fontSize: 18, letterSpacing: -0.4, fontWeight: '900' },
  heroBrandCaption: { color: palette.textFaint, fontSize: 9, letterSpacing: 1.6, marginTop: 4, fontWeight: '700' },
  heroMessage: { maxWidth: 370, marginTop: 46, marginBottom: 46 },
  heroEyebrow: { color: palette.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginBottom: 14 },
  heroTitle: { color: palette.text, fontSize: 42, lineHeight: 47, fontWeight: '900', letterSpacing: -2.1 },
  heroCopy: { color: palette.textMuted, fontSize: 14, lineHeight: 22, marginTop: 16, maxWidth: 320 },
  waveform: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 34 },
  waveformBar: { width: 4, borderRadius: 2, backgroundColor: 'rgba(206,255,87,0.64)' },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  heroLiveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.lime },
  heroFooterText: { color: palette.textFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  formPanel: { width: '100%' },
  formPanelWide: { flex: 1, justifyContent: 'center', paddingHorizontal: 54, paddingVertical: 44 },
  eyebrow: { color: palette.lime, fontWeight: '800', letterSpacing: 1.7, fontSize: 10 },
  profileTitle: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -1.4, marginTop: 10 },
  profileTitleWide: { fontSize: 34, lineHeight: 40 },
  profileSubtitle: { color: palette.textMuted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 27 },
  inputLabel: { color: palette.textFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 8 },
  nameInput: { height: 50, paddingHorizontal: 14, borderRadius: radii.sm, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surfaceRaised, color: palette.text, marginBottom: 22, fontSize: 15 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  avatarGridWide: { gap: 6 },
  avatarChoice: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceRaised, borderWidth: 1, borderColor: 'transparent' },
  avatarChoiceWide: { width: 40, height: 40 },
  avatarChoiceSelected: { backgroundColor: palette.limeWash, borderColor: palette.lime },
  avatarChoiceText: { fontSize: 20 },
  primaryButton: { minHeight: 52, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.lime, marginTop: 4 },
  primaryButtonText: { color: palette.ink, fontSize: 14, fontWeight: '900', letterSpacing: 0.1 },
  privacyNote: { color: palette.textFaint, fontSize: 10, textAlign: 'center', marginTop: 15 },
  errorText: { color: palette.warning, fontSize: 12, marginBottom: 8 },
  brandMarkText: { color: palette.ink, fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  pressed: { opacity: 0.82 },
  loadingScreen: { flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : undefined, backgroundColor: palette.page, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
});
