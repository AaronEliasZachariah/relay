/**
 * Relay design tokens.
 *
 * Everything visual flows from this file: a small raw palette, two semantic
 * themes (light/dark) built on top of it, plus type, spacing, radius and
 * shadow scales. Components never reference raw hex values — they read semantic
 * keys off the active theme so dark mode and future re-skins are free.
 */

import { Platform } from 'react-native';

/* -------------------------------------------------------------------------- */
/*  Raw palette                                                               */
/* -------------------------------------------------------------------------- */

const palette = {
  // Brand — "Relay" indigo→violet. Distinct from WhatsApp green on purpose:
  // premium, calm, trustworthy.
  indigo50: '#EEF0FF',
  indigo100: '#E0E3FF',
  indigo200: '#C4C8FF',
  indigo300: '#A2A6FF',
  indigo400: '#7E80FB',
  indigo500: '#5B5BF0', // primary
  indigo600: '#4B45D9',
  indigo700: '#3D38B5',
  violet400: '#9B6CFF',
  violet500: '#8B5CF6',

  // Neutrals — slightly cool, with a hint of indigo in the darks so the whole
  // UI feels like one family rather than brand-on-grey.
  ink950: '#0A0A12',
  ink900: '#101019',
  ink800: '#1A1A26',
  ink700: '#262633',
  ink600: '#3A3A48',
  slate500: '#6B6B7B',
  slate400: '#8A8A99',
  slate300: '#A8A8B6',
  slate200: '#D6D6DE',
  slate150: '#E4E4EB',
  slate100: '#EFEFF3',
  slate50: '#F7F7FA',
  white: '#FFFFFF',

  // Status
  green500: '#16B364',
  green600: '#0E9F58',
  green50: '#E7F8EF',
  amber500: '#F5A524',
  amber50: '#FDF3E2',
  red500: '#E5484D',
  red50: '#FCEBEC',
  blue500: '#3B82F6',
  blue50: '#E8F1FE',
} as const;

/* -------------------------------------------------------------------------- */
/*  Semantic colors                                                           */
/* -------------------------------------------------------------------------- */

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  bgSunken: string;
  bgMuted: string;
  bgInput: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  border: string;
  borderStrong: string;
  hairline: string;

  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;

  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;

  tabBar: string;
  tabActive: string;
  tabInactive: string;

  overlay: string;
  skeleton: string;

  /** Brand gradient stops (start → end), used on hero CTAs and the logo. */
  brandGradient: readonly [string, string];
  /** Soft tint gradient for large surfaces / headers. */
  surfaceGradient: readonly [string, string];
};

export const lightColors: ThemeColors = {
  bg: palette.slate50,
  bgElevated: palette.white,
  bgSunken: palette.slate100,
  bgMuted: palette.slate100,
  bgInput: palette.white,

  text: palette.ink900,
  textSecondary: palette.slate500,
  textMuted: palette.slate400,
  textInverse: palette.white,

  border: palette.slate150,
  borderStrong: palette.slate200,
  hairline: 'rgba(10,10,18,0.07)',

  primary: palette.indigo500,
  primaryPressed: palette.indigo600,
  primarySoft: palette.indigo50,
  onPrimary: palette.white,

  success: palette.green600,
  successSoft: palette.green50,
  warning: palette.amber500,
  warningSoft: palette.amber50,
  danger: palette.red500,
  dangerSoft: palette.red50,
  info: palette.blue500,
  infoSoft: palette.blue50,

  tabBar: 'rgba(255,255,255,0.92)',
  tabActive: palette.indigo500,
  tabInactive: palette.slate400,

  overlay: 'rgba(10,10,18,0.45)',
  skeleton: palette.slate150,

  brandGradient: [palette.indigo500, palette.violet500],
  surfaceGradient: [palette.indigo50, palette.slate50],
};

export const darkColors: ThemeColors = {
  bg: palette.ink950,
  bgElevated: palette.ink900,
  bgSunken: '#08080E',
  bgMuted: palette.ink800,
  bgInput: palette.ink800,

  text: '#F3F3F7',
  textSecondary: palette.slate300,
  textMuted: palette.slate500,
  textInverse: palette.ink950,

  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.16)',
  hairline: 'rgba(255,255,255,0.08)',

  primary: palette.indigo400,
  primaryPressed: palette.indigo300,
  primarySoft: 'rgba(91,91,240,0.16)',
  onPrimary: palette.white,

  success: '#3DD68C',
  successSoft: 'rgba(22,179,100,0.16)',
  warning: '#FBBF4D',
  warningSoft: 'rgba(245,165,36,0.16)',
  danger: '#FF6369',
  dangerSoft: 'rgba(229,72,77,0.16)',
  info: '#5B9DFF',
  infoSoft: 'rgba(59,130,246,0.16)',

  tabBar: 'rgba(16,16,25,0.92)',
  tabActive: palette.indigo400,
  tabInactive: palette.slate500,

  overlay: 'rgba(0,0,0,0.6)',
  skeleton: palette.ink800,

  brandGradient: [palette.indigo400, palette.violet400],
  surfaceGradient: ['#16161F', palette.ink950],
};

/* -------------------------------------------------------------------------- */
/*  Typography — Inter, mapped to weight-specific families                     */
/* -------------------------------------------------------------------------- */

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export type TypeVariant = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
};

export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  h1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  title: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  callout: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, letterSpacing: -0.1 },
  subhead: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19, letterSpacing: 0 },
  footnote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, letterSpacing: 0 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  overline: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.6 },
  button: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, letterSpacing: -0.1 },
} as const satisfies Record<string, TypeVariant>;

export type TypeName = keyof typeof type;

/* -------------------------------------------------------------------------- */
/*  Spacing / radius / layout                                                 */
/* -------------------------------------------------------------------------- */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
  '6xl': 72,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  pill: 999,
} as const;

export const layout = {
  screenPadding: 20,
  rowMinHeight: 56,
  tabBarHeight: 64,
  maxContentWidth: 480, // keeps web preview phone-shaped
} as const;

/* -------------------------------------------------------------------------- */
/*  Shadows — layered, soft. iOS shadow* + Android elevation.                  */
/* -------------------------------------------------------------------------- */

type Shadow = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

const makeShadow = (
  y: number,
  blur: number,
  opacity: number,
  elevation: number,
  color = '#0A0A12',
): Shadow => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: y },
  shadowOpacity: opacity,
  shadowRadius: blur,
  elevation,
});

export const shadows = {
  none: makeShadow(0, 0, 0, 0),
  sm: makeShadow(2, 6, 0.06, 2),
  md: makeShadow(6, 16, 0.1, 6),
  lg: makeShadow(12, 28, 0.14, 12),
  // Soft colored glow under primary CTAs.
  primaryGlow: makeShadow(8, 20, 0.35, 10, palette.indigo500),
} as const;

/** Hairline that respects platform pixel density. */
export const hairlineWidth = Platform.select({ ios: 0.5, default: 1 }) as number;

export { palette };
