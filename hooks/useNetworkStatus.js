import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    // Используем встроенное API браузера для web и fallback для React Native
    const handleOnline = () => {
      setIsConnected(true);
      setConnectionType('wifi');
    };
    const handleOffline = () => {
      setIsConnected(false);
      setConnectionType('none');
    };

    if (typeof window !== 'undefined' && window.addEventListener && navigator?.onLine !== undefined) {
      // Web platform only (not React Native)
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Определяем начальное состояние
      setIsConnected(navigator.onLine ?? true);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Fallback for React Native: assume always connected
    setIsConnected(true);
    return undefined;
  }, []);

  return {
    isConnected,
    lastStatus: null,
    connectionType,
    isWifi: connectionType === 'wifi' || connectionType === 'unknown',
    isCellular: connectionType === 'cellular',
  };
}