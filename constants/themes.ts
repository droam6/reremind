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
  chartGrid: string;
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
  safe: '#6B9E70',
  tabBar: '#000000',
  cardBorder: '#2A2A2A',
  separator: '#1E1E1E',
  overlay: 'rgba(0,0,0,0.7)',
  ringTrack: '#1A1A1A',
  chartGrid: '#1E1E1E',
  black: '#000000',
};

export const LIGHT_THEME: ThemeColors = {
  background: '#F5F0EB',
  surface: '#FFFFFF',
  surfaceLight: '#EDE8E3',
  text: '#2C2520',
  textSecondary: '#8A7E74',
  textTertiary: '#BDB3A8',
  accent: '#8B6D2E',
  accentDim: '#B8993F',
  danger: '#A33B3B',
  warning: '#B87A24',
  safe: '#5B7A5E',
  tabBar: '#F5F0EB',
  cardBorder: '#DDD6CE',
  separator: '#E5DED7',
  overlay: 'rgba(44, 37, 32, 0.5)',
  ringTrack: '#DDD6CE',
  chartGrid: '#E5DED7',
  black: '#000000',
};
