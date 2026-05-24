// Design tokens — paleta dark premium
export const colors = {
  // Backgrounds
  bg: {
    primary: '#0f0f1a',
    secondary: '#16162a',
    card: '#1e1e35',
    elevated: '#252540',
  },
  // Brand
  brand: {
    primary: '#7c6aff',
    secondary: '#5e4fff',
    accent: '#ff6b9d',
    teal: '#00d4aa',
  },
  // Gradients
  gradient: {
    primary: ['#7c6aff', '#5e4fff'],
    income: ['#00d4aa', '#00a885'],
    expense: ['#ff6b9d', '#e0437a'],
    card: ['#1e1e35', '#252540'],
  },
  // Text
  text: {
    primary: '#f0f0ff',
    secondary: '#9898b8',
    muted: '#5a5a7a',
    inverse: '#0f0f1a',
  },
  // Semantic
  success: '#00d4aa',
  danger: '#ff6b9d',
  warning: '#ffb347',
  info: '#7c6aff',
  // UI
  border: '#2a2a45',
  divider: '#1e1e35',
  overlay: 'rgba(15,15,26,0.85)',
  white: '#ffffff',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5 },
  button: { fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.3 },
} as const;

export const shadow = {
  sm: {
    shadowColor: '#7c6aff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#7c6aff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#7c6aff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;
