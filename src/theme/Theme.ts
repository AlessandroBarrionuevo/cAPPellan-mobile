import { StyleSheet } from 'react-native';

export const Theme = {
  colors: {
    background: '#FCFBF7',
    primary: '#0E3B69',
    primaryContainer: '#2C5282',
    onPrimary: '#FFFFFF',
    secondary: '#006A63',
    secondaryContainer: '#79F7EA',
    onSecondaryContainer: '#007169',
    surface: '#F9F9FF',
    surfaceContainerLowest: '#FFFFFF',
    onSurface: '#121C2C',
    onSurfaceVariant: '#43474F',
    outline: '#737780',
    error: '#BA1A1A',
  },
  spacing: {
    containerPadding: 24,
    gutter: 16,
    stackSm: 8,
    stackMd: 16,
    stackLg: 32,
    sectionGap: 48,
  },
  roundness: {
    sm: 4,
    lg: 8,
    xl: 12,
    full: 9999,
  },
  fonts: {
    headline: 'PlayfairDisplay_600SemiBold',
    headlineBold: 'PlayfairDisplay_700Bold',
    body: 'Inter_400Regular',
    bodySemiBold: 'Inter_600SemiBold',
  }
};

export const globalStyles = StyleSheet.create({
  displayLg: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    color: Theme.colors.primary,
  },
  headlineLg: {
    fontFamily: Theme.fonts.headline,
    fontSize: 32,
    lineHeight: 40,
    color: Theme.colors.primary,
  },
  headlineLgMobile: {
    fontFamily: Theme.fonts.headline,
    fontSize: 28,
    lineHeight: 36,
    color: Theme.colors.primary,
  },
  headlineMd: {
    fontFamily: Theme.fonts.headline,
    fontSize: 24,
    lineHeight: 32,
    color: Theme.colors.primary,
  },
  bodyLg: {
    fontFamily: Theme.fonts.body,
    fontSize: 18,
    lineHeight: 28,
    color: Theme.colors.onSurfaceVariant,
  },
  bodyMd: {
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: Theme.colors.onSurface,
  },
  bodySm: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.onSurfaceVariant,
  },
  labelCaps: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  shadowSoft: {
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2,
  }
});
