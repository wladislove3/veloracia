import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../utils/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function NetworkStatus() {
  const { isConnected, connectionType } = useNetworkStatus();
  const [visible, setVisible] = React.useState(!isConnected);
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!isConnected) {
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [isConnected]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.badge}>
        <Text style={styles.text}>
          {!isConnected
            ? 'Нет подключения к сети'
            : `Подключено: ${connectionType === 'wifi' ? 'Wi-Fi' : 'Мобильная сеть'}`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  badge: {
    backgroundColor: theme.colors.danger,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    letterSpacing: 0.4,
  },
});