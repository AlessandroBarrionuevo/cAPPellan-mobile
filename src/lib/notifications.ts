import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { request } from './api/client';
import { ENDPOINTS } from './api/endpoints';

let cachedDeviceToken: string | null = null;

// Global foreground notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    const isIncomingCall = data?.type === 'INCOMING_CALL';

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: isIncomingCall
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.DEFAULT,
    };
  },
});

// 40 cycles of (800ms vibrate, 400ms pause) = 48 seconds of continuous call vibration
const LONG_CALL_VIBRATION_PATTERN: number[] = [
  0,
  ...Array.from({ length: 40 }, () => [800, 400]).flat(),
];

/**
 * Configure high-priority Android notification channels for incoming calls and alerts
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // Clean up legacy channel with short vibration (Android caches channel vibration patterns immutably)
    await Notifications.deleteNotificationChannelAsync('incoming-calls').catch(() => {});

    // 1. High-priority channel for incoming pastoral calls (Wakes device & vibrates continuously ~48s)
    await Notifications.setNotificationChannelAsync('incoming-calls-v2', {
      name: 'Llamadas de Guardia Pastoral',
      description: 'Alertas de llamadas y videollamadas entrantes en tiempo real',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: LONG_CALL_VIBRATION_PATTERN,
      enableVibrate: true,
      lightColor: '#059669',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      sound: 'default',
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.NOTIFICATION_COMMUNICATION_REQUEST,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
    });

    // 2. Default channel for messages, general prayers and updates
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones Generales',
      description: 'Avisos del muro de oración, contenidos y bitácoras',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0F1E36',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      sound: 'default',
    });

    // 3. Interactive Notification Category with Action Buttons (Atender / Rechazar)
    await Notifications.setNotificationCategoryAsync('incoming-call', [
      {
        identifier: 'ACCEPT',
        buttonTitle: '🟢 Atender',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'REJECT',
        buttonTitle: '🔴 Rechazar',
        options: {
          isDestructive: true,
          opensAppToForeground: false,
        },
      },
    ]);
  } catch (err) {
    console.warn('[Notifications] Failed to setup notification channels:', err);
  }
}

/**
 * Request notification permissions and register native device push token (FCM/APNs) with backend
 */
export async function registerDevicePushToken(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted for push notifications.');
      return null;
    }

    await setupNotificationChannels();

    // Get native device token (FCM token on Android, APNs token on iOS)
    let tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData?.data;

    if (!token) {
      console.warn('[Notifications] Could not retrieve native push token.');
      return null;
    }

    if (token === cachedDeviceToken) {
      return token;
    }

    // Register with Spring Boot backend
    await request(ENDPOINTS.USER_DEVICE_TOKEN, {
      method: 'POST',
      body: JSON.stringify({
        token,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        type: 'CALL',
      }),
    });

    cachedDeviceToken = token;
    console.log('[Notifications] Device token registered successfully with backend.');
    return token;
  } catch (err) {
    console.warn('[Notifications] Failed to register device push token:', err);
    return null;
  }
}

/**
 * Remove device push token from backend (e.g. on user logout)
 */
export async function unregisterDevicePushToken(): Promise<void> {
  let token = cachedDeviceToken;
  if (!token) {
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      token = tokenData?.data || null;
    } catch {
      // Ignore if device token could not be queried
    }
  }

  if (!token) return;

  try {
    await request(ENDPOINTS.USER_DEVICE_TOKEN, {
      method: 'DELETE',
      body: JSON.stringify({
        token,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        type: 'CALL',
      }),
    });
    cachedDeviceToken = null;
    console.log('[Notifications] Device token removed on logout.');
  } catch (err) {
    console.warn('[Notifications] Failed to unregister device push token:', err);
  }
}

/**
 * Start loop vibration for incoming pastoral call
 */
export function startIncomingCallVibration(): void {
  try {
    Vibration.vibrate([0, 600, 300, 600, 300, 600], true);
  } catch (err) {
    console.warn('[Notifications] Vibration error:', err);
  }
}

/**
 * Stop loop vibration
 */
export function stopIncomingCallVibration(): void {
  try {
    Vibration.cancel();
  } catch (err) {
    console.warn('[Notifications] Vibration cancel error:', err);
  }
}

/**
 * Trigger or dismiss notifications for incoming call life cycle
 */
export async function dismissIncomingCallNotifications(): Promise<void> {
  stopIncomingCallVibration();
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (err) {
    console.warn('[Notifications] Failed to dismiss notifications:', err);
  }
}

/**
 * Backwards compatibility helper for existing callers
 */
export async function requestNotificationPermissionAndScheduleReminder(): Promise<boolean> {
  const token = await registerDevicePushToken();
  return Boolean(token);
}
