/** Soft pastel palette — low stimulation, no neon */
export const colors = {
  background: '#EEF6F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F5FAF8',
  border: '#D4E5E0',
  text: '#3D4F4C',
  textMuted: '#6B7F7A',
  primary: '#7BA7A8',
  primaryDark: '#5E8A8B',
  accent: '#C4B5D8',
  accentSoft: '#E8E0F2',
  success: '#A3D9A5',
  successSoft: '#E3F5E4',
  warningSoft: '#FFF4E0',
  outline: '#B8C9C4',
} as const;

export type ColorKey = keyof typeof colors;
