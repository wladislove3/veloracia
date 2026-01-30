import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../utils/theme';

const EMOJI_LIST = ['🚴', '🚵', '🚲', '🦸', '🦹', '🧑‍🚀', '🧑‍🔬', '🧑‍🎤', '🧑‍🌾', '🧑‍🎨', '🧑‍🏫', '🧑‍💻', '🧑‍🔧', '🧑‍🍳', '🧑‍🚒', '🧑‍✈️', '🧑‍🚀', '🧑‍⚕️', '🧑‍🎓', '🧑‍🏭'];

function getRandomEmoji() {
  return EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)];
}

export default function GuestLogin({ onLogin }) {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(getRandomEmoji());
  const [error, setError] = useState('');

  const handleRandomAvatar = () => setAvatar(getRandomEmoji());

  const handleLogin = async () => {
    if (!nickname.trim()) {
      setError('Введите никнейм');
      return;
    }
    const user = { nickname: nickname.trim(), avatar };
    await AsyncStorage.setItem('userProfile', JSON.stringify(user));
    onLogin(user);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbPrimary} />
      <View style={styles.bgOrbAccent} />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Veloraz Radio</Text>
        <Text style={styles.title}>Вход в эфир</Text>
        <Text style={styles.subtitle}>Создайте никнейм и выберите характерный аватар, чтобы присоединиться к эфиру.</Text>
        <TouchableOpacity onPress={handleRandomAvatar} style={styles.avatarBtn} activeOpacity={0.85}>
          <Text style={styles.avatar}>{avatar}</Text>
          <View>
            <Text style={styles.avatarLabel}>Аватар</Text>
            <Text style={styles.avatarText}>Сгенерировать новый</Text>
          </View>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Ваш никнейм"
          placeholderTextColor={theme.colors.textMuted}
          value={nickname}
          onChangeText={setNickname}
          maxLength={20}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.9}>
          <Text style={styles.buttonText}>Войти в эфир</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.fonts.display,
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textMuted,
    marginBottom: 20,
    fontFamily: theme.fonts.body,
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    marginBottom: 16,
  },
  avatar: {
    fontSize: 44,
    marginRight: 10,
  },
  avatarLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
    marginBottom: 12,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    backgroundColor: theme.colors.surface,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    letterSpacing: 0.4,
    fontFamily: theme.fonts.bodyBold,
  },
  error: {
    color: theme.colors.danger,
    marginBottom: 8,
    fontFamily: theme.fonts.body,
  },
  bgOrbPrimary: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: theme.colors.accentSoft,
    top: -60,
    right: -80,
  },
  bgOrbAccent: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D8EFE9',
    bottom: -40,
    left: -40,
  },
});