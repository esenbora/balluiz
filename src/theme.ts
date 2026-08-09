// Apple Human Interface Guidelines paleti: iOS sistem renkleri, açık/koyu tema.
// Tipografi RN varsayılan sistem fontunu (iOS'ta SF Pro) kullanır.
import { useColorScheme } from 'react-native';

export interface Palette {
  scheme: 'light' | 'dark';
  bg: string; // systemGroupedBackground
  card: string; // secondarySystemGroupedBackground
  cardHigh: string; // tertiarySystemGroupedBackground
  fill: string; // systemFill (kontrol zeminleri)
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
  separator: string;
  tint: string; // systemBlue
  green: string;
  red: string;
  orange: string;
  yellow: string;
  x: string; // oyuncu X rengi (blue)
  o: string; // oyuncu O rengi (red)
}

export const lightPalette: Palette = {
  scheme: 'light',
  bg: '#F2F2F7',
  card: '#FFFFFF',
  cardHigh: '#F2F2F7',
  fill: 'rgba(120,120,128,0.12)',
  label: '#000000',
  secondaryLabel: '#6E6E73',
  tertiaryLabel: '#AEAEB2',
  separator: 'rgba(60,60,67,0.29)',
  tint: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  x: '#007AFF',
  o: '#FF3B30',
};

export const darkPalette: Palette = {
  scheme: 'dark',
  bg: '#000000',
  card: '#1C1C1E',
  cardHigh: '#2C2C2E',
  fill: 'rgba(120,120,128,0.24)',
  label: '#FFFFFF',
  secondaryLabel: '#98989E',
  tertiaryLabel: '#5B5B60',
  separator: 'rgba(84,84,88,0.6)',
  tint: '#0A84FF',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  x: '#0A84FF',
  o: '#FF453A',
};

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? darkPalette : lightPalette;
}

// iOS "continuous" köşe hissi
export const radius = { sm: 8, md: 12, lg: 16, xl: 22 };

export const font = {
  largeTitle: 34,
  title: 28,
  h2: 20,
  body: 17,
  sub: 15,
  small: 13,
  caption: 11,
};
