export const colors = {
  background: '#F4F9FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF3FF',
  border: '#DCECFF',

  primary: '#0E7CFF',
  primaryDark: '#0A5FD0',
  primarySoft: '#D6EAFF',

  success: '#2BB673',
  warning: '#FFB020',
  danger: '#FF4D5E',

  text: '#0B1B33',
  textSecondary: '#5B6B84',
  textMuted: '#8FA3BE',

  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const },
  heading: { fontSize: 20, fontWeight: '600' as const },
  subheading: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0B1B33',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;
