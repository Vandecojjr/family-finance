// Design tokens — Soft & Airy Dark Theme
export const colors = {
  // Backgrounds
  bg: {
    primary: '#1A1D24', // Soft cool dark blue-gray (not heavy black)
    secondary: '#222630', // Slightly lighter for contrast
    card: '#222630', // Comfortable card background
    elevated: '#2A2E39', // Elevated elements
  },
  // Brand
  brand: {
    primary: '#818CF8', // Soft Pastel Indigo
    secondary: '#A78BFA', // Soft Pastel Violet
    accent: '#34D399', // Soft Pastel Emerald
    teal: '#2DD4BF', // Soft Teal
  },
  // Gradients
  gradient: {
    primary: ['#818CF8', '#A78BFA'], // Soft Indigo to Violet
    income: ['#34D399', '#10B981'], // Soft Emerald
    expense: ['#FB7185', '#F43F5E'], // Soft Rose
    card: ['#222630', '#2A2E39'],
  },
  // Text
  text: {
    primary: '#F3F4F6', // Off-white (easy on the eyes)
    secondary: '#9CA3AF', // Cool gray
    muted: '#6B7280', // Darker gray
    inverse: '#111827', // Dark for contrast on light badges
  },
  // Semantic
  success: '#34D399',
  danger: '#FB7185',
  warning: '#FBBF24',
  info: '#60A5FA',
  // UI
  border: '#374151', // Soft border
  divider: '#2A2E39',
  overlay: 'rgba(15, 23, 42, 0.6)',
  white: '#ffffff',
  transparent: 'transparent',
  // Chart segment colors
  chart: [
    '#818CF8', // Pastel Indigo
    '#34D399', // Pastel Emerald
    '#FB7185', // Pastel Rose
    '#FBBF24', // Pastel Amber
    '#A78BFA', // Pastel Violet
    '#F472B6', // Pastel Pink
    '#22D3EE', // Pastel Cyan
    '#A3E635', // Pastel Lime
    '#FB923C', // Pastel Orange
    '#60A5FA', // Pastel Blue
  ],
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
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
