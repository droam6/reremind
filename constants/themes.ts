export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentDim: string;
  danger: string;
  warning: string;
  safe: string;
  tabBar: string;
  cardBorder: string;
  separator: string;
  overlay: string;
  ringTrack: string;
  black: string;
}

export const DARK_THEME: ThemeColors = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceLight: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#6B6B6B',
  textTertiary: '#3A3A3A',
  accent: '#C9A84C',
  accentDim: '#8A7433',
  danger: '#C44A4A',
  warning: '#D4913A',
  safe: '#FFFFFF',
  tabBar: '#000000',
  cardBorder: '#2A2A2A',
  separator: '#1E1E1E',
  overlay: 'rgba(0,0,0,0.7)',
  ringTrack: '#1A1A1A',
  black: '#000000',
};

export const LIGHT_THEME: ThemeColors = {
  background: '#F5F0EB',
  surface: '#FFFFFF',
  surfaceLight: '#EDE8E3',
  text: '#1A1A1A',
  textSecondary: '#7A7168',
  textTertiary: '#B5ADA5',
  accent: '#9B7B3A',
  accentDim: '#C4A96A',
  danger: '#B84040',
  warning: '#C4862E',
  safe: '#1A1A1A',
  tabBar: '#FFFFFF',
  cardBorder: '#E0D9D2',
  separator: '#E8E2DC',
  overlay: 'rgba(0,0,0,0.4)',
  ringTrack: '#E0D9D2',
  black: '#000000',
};
