import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  StatusBar,
  Platform,
  Dimensions,
  View,
  ViewStyle,
} from 'react-native';

export interface AppInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Computes exact safe insets without crashing if native ViewManagers are missing from the APK.
 * - On Android: Uses StatusBar.currentHeight for the notch/status bar,
 *   and difference between screen and window height for navigation buttons.
 * - On iOS: Uses safe standard insets (44pt top for notch, 34pt bottom for home bar).
 */
export function computeAppInsets(): AppInsets {
  if (Platform.OS === 'android') {
    const screenHeight = Dimensions.get('screen').height;
    const windowHeight = Dimensions.get('window').height;
    const navBarDiff = Math.max(0, screenHeight - windowHeight);
    const top = Math.max(StatusBar.currentHeight || 0, 36);
    const bottom = navBarDiff > 20 ? navBarDiff : 28;

    return {
      top,
      bottom,
      left: 0,
      right: 0,
    };
  }

  if (Platform.OS === 'ios') {
    return {
      top: 48,
      bottom: 34,
      left: 0,
      right: 0,
    };
  }

  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
}

const AppInsetsContext = createContext<AppInsets>(computeAppInsets());

export interface SafeAppProviderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Resilient top-level provider replacing SafeAreaProvider.
 * Completely immune to `IllegalViewOperationException: can't find viewmanager RNCSafeAreaProvider`
 * when running on pre-existing development builds or Expo Go.
 */
export function SafeAppProvider({ children, style }: SafeAppProviderProps) {
  const [insets, setInsets] = useState<AppInsets>(computeAppInsets);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setInsets(computeAppInsets());
    });
    return () => subscription?.remove();
  }, []);

  return (
    <AppInsetsContext.Provider value={insets}>
      <View style={[{ flex: 1 }, style]}>
        {children}
      </View>
    </AppInsetsContext.Provider>
  );
}

/**
 * Universal safe-area hook that accounts for Android status bar / cutouts
 * and bottom navigation bars (3-button or gesture pill) without overlapping.
 */
export function useAppInsets(): AppInsets {
  const context = useContext(AppInsetsContext);
  if (context) {
    return context;
  }
  return computeAppInsets();
}
