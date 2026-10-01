/** Canonical native tokens; DESIGN.md documents these values. */
export const colors = {
  background: '#fff8f5',
  surface: '#fffbf9',
  primary: '#bb1820',
  primaryPressed: '#a31019',
  burgundy: '#600b0f',
  text: '#3d3433',
  muted: '#75635f',
  border: '#8a2428',
  divider: '#edd3cf',
  blush: '#fbe1df',
  error: '#a61620',
  success: '#2b8954',
  successSurface: '#f0f6ee',
  white: '#ffffff',
} as const;

export const fonts = {
  regular: 'Outfit-Regular',
  semibold: 'Outfit-SemiBold',
  bold: 'Outfit-Bold',
  display: 'Outfit-ExtraBold',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radii = { field: 21, card: 20, pill: 999 } as const;
