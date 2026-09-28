import { StyleSheet } from 'react-native';

export const Theme = {
  colors: {
    // Stitch Core Theme
    background: '#F8F9FB',
    surface: '#F8F9FB',
    primary: '#0c7ae0', // Tactical navy
    primaryDark: '#0c7ae0',
    primaryContainer: '#1A1C1E',
    onPrimary: '#FFFFFF',
    secondary: '#505F76', // Slate blue
    secondaryContainer: '#D4E3FF',
    onSecondaryContainer: '#0c7ae0',
    onSecondaryFixed: '#0C1C30',
    tacticalNavy: '#0c7ae0',
    
    // Surface Elevation Tones
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F3F4F6',
    surfaceContainer: '#EDEEF0',
    surfaceContainerHigh: '#E7E8EA',
    surfaceContainerHighest: '#E1E2E4',
    
    // Typography & Outlines
    onSurface: '#191C1E',
    onSurfaceVariant: '#44474A',
    outline: '#75777A',
    outlineVariant: '#C5C6CA',
    
    // States
    error: '#BA1A1A',
    errorContainer: '#FFDAD6',
    onError: '#FFFFFF',
    success: '#2E694D',
    successContainer: '#D1E8D5',
    
    // Tactical Night / Red Mode
    tacticalRedBg: '#1A0B0B',
    tacticalRedSurface: '#240F0F',
    tacticalRedText: '#EF4444',
    tacticalRedTextLight: '#F87171',
    tacticalRedAccent: '#DC2626',
  },
  spacing: {
    space2xs: 4,
    spaceXs: 8,
    spaceSm: 12,
    spaceMd: 16,
    spaceLg: 24,
    spaceXl: 32,
    space2xl: 48,
    containerPadding: 20,
    gutter: 16,
    stackSm: 8,
    stackMd: 16,
    stackLg: 24,
    sectionGap: 36,
  },
  roundness: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  fonts: {
    headline: 'IosevkaCharon_500Medium',
    headlineBold: 'IosevkaCharon_700Bold',
    body: 'Commissioner_400Regular',
    bodySemiBold: 'Commissioner_600SemiBold',
  },
};

export const globalStyles = StyleSheet.create({
  displayLg: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: Theme.colors.onSurface,
  },
  headlineLg: {
    fontFamily: Theme.fonts.headline,
    fontSize: 26,
    lineHeight: 34,
    color: Theme.colors.onSurface,
  },
  headlineLgMobile: {
    fontFamily: Theme.fonts.headline,
    fontSize: 24,
    lineHeight: 32,
    color: Theme.colors.onSurface,
  },
  headlineMd: {
    fontFamily: Theme.fonts.headline,
    fontSize: 20,
    lineHeight: 28,
    color: Theme.colors.onSurface,
  },
  headlineSm: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    lineHeight: 26,
    color: Theme.colors.onSurface,
  },
  bodyLg: {
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: Theme.colors.onSurface,
  },
  bodyMd: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: Theme.colors.onSurface,
  },
  bodySm: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: Theme.colors.onSurfaceVariant,
  },
  bodySemiBold: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.onSurface,
  },
  labelLg: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelMd: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
  },
  labelCaps: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  shadowSoft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  shadowSm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  shadowMd: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
