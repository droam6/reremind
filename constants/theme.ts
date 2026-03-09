export const COLORS = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceLight: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#6B6B6B',
  textTertiary: '#4A4A4A',
  accent: '#C9A84C',
  accentDim: '#8A7433',
  danger: '#C44A4A',
  warning: '#D4913A',
  safe: '#FFFFFF',
  black: '#000000',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const FONT_SIZES = {
  hero: 64,
  heroSub: 20,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
} as const;

export const FONT_WEIGHTS = {
  heavy: '900' as const,
  bold: '700' as const,
  medium: '500' as const,
  regular: '400' as const,
};

export const BORDER_RADIUS = {
  sharp: 0,
  subtle: 4,
  button: 2,
} as const;
