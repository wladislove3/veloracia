import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { theme } from '../utils/theme';

export default function PushToTalkButton({ isSpeaking, inQueue, onPressIn, onPressOut, disabled, remainingTime }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Анимация масштаба (native driver)
  useEffect(() => {
    let isActive = true;
    let scaleLoop;

    const startAnimation = () => {
      if (!isActive) return;
      
      scaleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { 
            toValue: 1.15, 
            duration: 400, 
            useNativeDriver: true 
          }),
          Animated.timing(scaleAnim, { 
            toValue: 1, 
            duration: 400, 
            useNativeDriver: true 
          }),
        ])
      );
      scaleLoop.start();
    };

    const stopAnimation = () => {
      if (scaleLoop) {
        scaleLoop.stop();
        scaleLoop = null;
      }
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
    };

    if (isSpeaking) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      isActive = false;
      stopAnimation();
    };
  }, [isSpeaking, scaleAnim]);

  const title = disabled
    ? `Лимит исчерпан (${Math.ceil(remainingTime / 60000)} мин)`
    : isSpeaking
      ? 'Говорите…'
      : inQueue
        ? 'В очереди…'
        : 'Нажмите и говорите';

  const subtitle = disabled
    ? 'Через минуту можно снова в эфир'
    : isSpeaking
      ? 'Держите кнопку, чтобы продолжать'
      : inQueue
        ? 'Ожидайте, очередь движется'
        : 'Зажмите и удерживайте для записи';

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.halo, isSpeaking && styles.haloActive, disabled && styles.haloDisabled]} />
      <TouchableOpacity
        style={[
          styles.button,
          isSpeaking ? styles.speaking : inQueue ? styles.inQueue : styles.idle,
          disabled && styles.disabled
        ]}
        onPressIn={!disabled ? onPressIn : undefined}
        onPressOut={!disabled ? onPressOut : undefined}
        delayLongPress={0}
        activeOpacity={disabled ? 1 : 0.85}
      >
        <Text style={styles.text}>{title}</Text>
        <Text style={styles.subtext}>{subtitle}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.accentSoft,
    opacity: 0.6,
  },
  haloActive: {
    backgroundColor: theme.colors.success,
    opacity: 0.35,
  },
  haloDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.4,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 240,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    ...theme.shadow,
  },
  idle: {
    backgroundColor: theme.colors.primary,
  },
  speaking: {
    backgroundColor: theme.colors.success,
  },
  inQueue: {
    backgroundColor: theme.colors.accent,
  },
  text: {
    color: '#fff',
    fontSize: 17,
    fontFamily: theme.fonts.bodyBold,
    letterSpacing: 0.3,
  },
  subtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: theme.fonts.body,
  },
  disabled: {
    backgroundColor: '#9e9e9e',
    opacity: 0.8,
  },
});