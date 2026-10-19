import { requireNativeModule, Platform } from 'expo-modules-core';

export interface IncomingCallOptions {
  sessionId: number;
  callerName?: string | null;
  sessionType?: string | null;
  token?: string | null;
  livekitRoom?: string | null;
}

interface IncomingCallNativeModule {
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): void;
  displayIncomingCall(options: IncomingCallOptions): boolean;
  dismissIncomingCall(sessionId: number): void;
  turnScreenOnAndDismissKeyguard(): void;
}

const NativeModule: IncomingCallNativeModule | null =
  Platform.OS === 'android' ? requireNativeModule<IncomingCallNativeModule>('IncomingCall') : null;

export function canUseFullScreenIntent(): boolean {
  if (Platform.OS !== 'android' || !NativeModule) return true;
  try {
    return NativeModule.canUseFullScreenIntent();
  } catch {
    return true;
  }
}

export function openFullScreenIntentSettings(): void {
  if (Platform.OS !== 'android' || !NativeModule) return;
  try {
    NativeModule.openFullScreenIntentSettings();
  } catch (err) {
    console.warn('[IncomingCallModule] Failed to open full screen intent settings:', err);
  }
}

export function displayNativeIncomingCall(options: IncomingCallOptions): boolean {
  if (Platform.OS !== 'android' || !NativeModule) return false;
  try {
    return NativeModule.displayIncomingCall(options);
  } catch (err) {
    console.warn('[IncomingCallModule] Failed to display native incoming call:', err);
    return false;
  }
}

export function dismissNativeIncomingCall(sessionId: number): void {
  if (Platform.OS !== 'android' || !NativeModule) return;
  try {
    NativeModule.dismissIncomingCall(sessionId);
  } catch (err) {
    console.warn('[IncomingCallModule] Failed to dismiss native incoming call:', err);
  }
}

export function turnScreenOnAndDismissKeyguard(): void {
  if (Platform.OS !== 'android' || !NativeModule) return;
  try {
    NativeModule.turnScreenOnAndDismissKeyguard();
  } catch (err) {
    console.warn('[IncomingCallModule] Failed to turn screen on:', err);
  }
}
