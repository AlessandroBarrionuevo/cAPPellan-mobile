import { Platform } from 'react-native';

const defaultHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const ENV = {
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_URL || `http://${defaultHost}:8080`,
  LIVEKIT_WS_URL:
    process.env.EXPO_PUBLIC_LIVEKIT_WS_URL || `ws://${defaultHost}:7880`,
  IS_DEV: __DEV__,
} as const;
