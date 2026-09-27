import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { palette, radii, shadows, spacing } from '../../../shared/ui/tokens';
import { PROFILE_AVATARS } from '../domain/profile';

export function ProfileSetup({ onSave }) {
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
      <View style={styles.profileCard}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>V</Text></View>
        <Text style={styles.eyebrow}>VELO · ЛОКАЛЬНЫЙ ЭФИР</Text>
        <Text style={styles.profileTitle}>Город звучит ближе.</Text>
        <Text style={styles.profileSubtitle}>Выберите имя — и слушайте голоса людей вокруг.</Text>
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
        <View style={styles.avatarGrid}>
          {PROFILE_AVATARS.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Аватар ${item}`}
              accessibilityState={{ selected: avatar === item }}
              onPress={() => setAvatar(item)}
              style={[styles.avatarChoice, avatar === item && styles.avatarChoiceSelected]}
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
  eyebrow: { color: palette.lime, fontWeight: '800', letterSpacing: 1.7, fontSize: 10 },
  profileTitle: { color: palette.text, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -1.4, marginTop: 10 },
  profileSubtitle: { color: palette.textMuted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 27 },
  inputLabel: { color: palette.textFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginBottom: 8 },
  nameInput: { height: 50, paddingHorizontal: 14, borderRadius: radii.sm, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surfaceRaised, color: palette.text, marginBottom: 22, fontSize: 15 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  avatarChoice: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceRaised, borderWidth: 1, borderColor: 'transparent' },
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
