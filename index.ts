import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  try {
    const { registerGlobals } = require('@livekit/react-native');
    registerGlobals();
  } catch (e) {
    console.warn(
      '[LiveKit] WebRTC native module is not present in this runtime. ' +
      'A fresh native build (EAS Build / expo run:android) is required for WebRTC calls.'
    );
  }
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
