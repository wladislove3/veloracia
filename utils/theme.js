import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#F6F4EF',
    surface: '#FFFFFF',
    surfaceMuted: '#F0ECE6',
    primary: '#0B6E6A',
    primaryDark: '#074C4A',
    accent: '#F2A541',
    accentSoft: '#FBE2C4',
    text: '#1C2321',
    textMuted: '#637381',
    success: '#2EBFA5',
    danger: '#E4572E',
    border: '#E1D9CE',
  },
  fonts: {
    display: Platform.select({ ios: 'Georgia', android: 'serif' }),
    body: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
    bodyBold: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
    mono: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  shadow: {
    shadowColor: '#0B6E6A',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
};
