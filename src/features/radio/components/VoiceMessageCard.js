import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../radioDashboard.styles';
import { formatRelativeMessageAge } from '../presentation/formatters';

export default function VoiceMessageCard({ message, isPlaying, onPlay }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isPlaying ? 'Остановить' : 'Слушать'} сообщение от ${message.nickname || 'велосипедиста'}`}
      accessibilityState={{ selected: isPlaying }}
      onPress={() => onPlay(message, isPlaying)}
      style={({ pressed }) => [styles.messageCard, isPlaying && styles.messageCardPlaying, pressed && styles.pressed]}
    >
      <View style={styles.messageAvatar}><Text>{message.avatar || '🎙️'}</Text></View>
      <View style={styles.messageCopy}>
        <Text numberOfLines={1} style={styles.messageName}>{message.nickname || 'Аноним'}</Text>
        <Text style={styles.messageMeta}>{formatRelativeMessageAge(message.createdAt)} · голосовое</Text>
      </View>
      <View style={[styles.playButton, isPlaying && styles.playButtonActive]}>
        <Text style={styles.playButtonText}>{isPlaying ? 'Ⅱ' : '▶'}</Text>
      </View>
    </Pressable>
  );
}
