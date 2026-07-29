// Design tokens — paleta dark premium
export const colors = {
  // Backgrounds
  bg: {
    primary: '#09090b', // zinc-950
    secondary: '#18181b', // zinc-900
    card: '#18181b', // zinc-900
    elevated: '#27272a', // zinc-800
  },
  // Brand
  brand: {
    primary: '#3b82f6', // blue-500
    secondary: '#2563eb', // blue-600
    accent: '#10b981', // emerald-500
    teal: '#14b8a6', // teal-500
  },
  // Gradients
  gradient: {
    primary: ['#3b82f6', '#2563eb'],
    income: ['#10b981', '#059669'],
    expense: ['#ef4444', '#dc2626'],
    card: ['#18181b', '#27272a'],
  },
  // Text
  text: {
    primary: '#fafafa', // zinc-50
    secondary: '#a1a1aa', // zinc-400
    muted: '#71717a', // zinc-500
    inverse: '#09090b', // zinc-950
  },
  // Semantic
  success: '#10b981', // emerald-500
  danger: '#ef4444', // red-500
  warning: '#f59e0b', // amber-500
  info: '#3b82f6', // blue-500
  // UI
  border: '#27272a', // zinc-800
  divider: '#27272a', // zinc-800
  overlay: 'rgba(9, 9, 11, 0.85)',
  white: '#ffffff',
  transparent: 'transparent',
  // Chart segment colors
  chart: [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#ef4444', // red
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
