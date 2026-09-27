import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { voiceMessageStyles as styles } from './voiceMessageCard.styles';
import { formatRelativeMessageAge } from '../presentation/formatters';

export default function VoiceMessageCard({ message, isPlaying, onPlay }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isPlaying ? 'Остановить' : 'Слушать'} сообщение от ${message.nickname || 'велосипедиста'}`}
      accessibilityState={{ selected: isPlaying }}
      onPress={() => onPlay(message, isPlaying)}
      style={({ pressed }) => [styles.card, isPlaying && styles.playing, pressed && styles.pressed]}
    >
      <View style={styles.avatar}><Text>{message.avatar || '🎙️'}</Text></View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>{message.nickname || 'Аноним'}</Text>
        <Text style={styles.meta}>{formatRelativeMessageAge(message.createdAt)} · голосовое</Text>
      </View>
      <View style={[styles.playButton, isPlaying && styles.playButtonActive]}>
        <Text style={styles.playButtonText}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
      </View>
    </Pressable>
  );
}
