import { requireNativeModule, Platform } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';

export interface IncomingCallOptions {
  sessionId: number;
  callerName?: string | null;
  sessionType?: string | null;
  token?: string | null;
  livekitRoom?: string | null;
}

export interface InitialCallData {
  sessionId?: string;
  callerName?: string;
  sessionType?: string;
  token?: string;
  livekitRoom?: string;
  action?: string;
}

interface IncomingCallNativeModule {
  getInitialCallData(): InitialCallData | null;
  clearInitialCallData(): void;
  consumeLastRejectedSessionId(): number | null;
  setAuthContext(token: string | null, baseUrl: string | null, role: string | null): void;
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): void;
  displayIncomingCall(options: IncomingCallOptions): boolean;
  dismissIncomingCall(sessionId: number): void;
  turnScreenOnAndDismissKeyguard(): void;
  addListener(eventName: string, listener: (...args: any[]) => void): EventSubscription;
}

const NativeModule: IncomingCallNativeModule | null =
  Platform.OS === 'android' ? requireNativeModule<IncomingCallNativeModule>('IncomingCall') : null;

export function getInitialCallData(): InitialCallData | null {
  if (Platform.OS !== 'android' || !NativeModule) return null;
  try {
    return NativeModule.getInitialCallData() || null;
  } catch (err) {
    console.warn('[IncomingCallModule] Failed to get initial call data:', err);
    return null;
  }
}

export function clearInitialCallData(): void {
  if (Platform.OS !== 'android' || !NativeModule) return;
  try {
    NativeModule.clearInitialCallData();
  } catch (err) {
    console.warn('[IncomingCallModule] Failed to clear initial call data:', err);
  }
}

export function consumeLastRejectedSessionId(): number | null {
  if (Platform.OS !== 'android' || !NativeModule) return null;
  try {
    return NativeModule.consumeLastRejectedSessionId?.() ?? null;
  } catch {
    return null;
  }
}

export function setNativeAuthContext(
  token: string | null,
  baseUrl: string | null,
  role: string | null = null
): void {
  if (Platform.OS !== 'android' || !NativeModule) return;
  try {
    NativeModule.setAuthContext(token, baseUrl, role);
  } catch (err) {
    console.warn('[IncomingCallModule] Failed to set native auth context:', err);
  }
}

export function addIncomingCallRejectedListener(
  listener: (event: { sessionId: number }) => void
): { remove: () => void } {
  if (Platform.OS !== 'android' || !NativeModule) return { remove: () => {} };
  try {
    return (NativeModule as any).addListener('onIncomingCallRejected', listener);
  } catch (err) {
    console.warn('[IncomingCallModule] Failed to add onIncomingCallRejected listener:', err);
    return { remove: () => {} };
  }
}

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
