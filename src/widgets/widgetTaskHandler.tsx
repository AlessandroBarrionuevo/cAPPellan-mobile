import React from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import {
  requestWidgetUpdate,
  requestPinWidget,
  type WidgetTaskHandlerProps,
} from 'react-native-android-widget';
import { PerlitaAndroidWidget } from './PerlitaAndroidWidget';
import {
  getDeterministicForcePerlita,
  getRandomForcePerlita,
} from '../data/perlitasData';
import type { Perlita } from '../types/bible';

export const PERLITA_WIDGET_NAME = 'PerlitaWidget';
const WIDGET_STORAGE_KEY = 'capellan_widget_perlita_v1';
const LOCKSCREEN_ENABLED_KEY = 'capellan_lockscreen_perlita_enabled_v1';
const LOCKSCREEN_NOTIFICATION_ID = 'perlita-lockscreen-active';
const LOCKSCREEN_DAILY_SCHEDULE_ID = 'perlita-lockscreen-daily';
export const PERLITA_LOCKSCREEN_CHANNEL_ID = 'perlita-lockscreen-v1';

interface StoredWidgetPerlita {
  dateIso: string;
  isRandom: boolean;
  perlita: Perlita;
}

function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
}

async function saveStoredWidgetPerlita(
  perlita: Perlita,
  isRandom = false
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const payload: StoredWidgetPerlita = {
      dateIso: getTodayIso(),
      isRandom,
      perlita,
    };
    await SecureStore.setItemAsync(WIDGET_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors in restricted background contexts
  }
}

async function loadStoredWidgetPerlita(): Promise<{
  perlita: Perlita;
  isRandom: boolean;
}> {
  if (Platform.OS !== 'web') {
    try {
      const raw = await SecureStore.getItemAsync(WIDGET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredWidgetPerlita;
        if (parsed?.perlita?.text && parsed.dateIso === getTodayIso()) {
          return {
            perlita: parsed.perlita,
            isRandom: Boolean(parsed.isRandom),
          };
        }
      }
    } catch {
      // Fallback to deterministic perlita
    }
  }
  return {
    perlita: getDeterministicForcePerlita(),
    isRandom: false,
  };
}

/**
 * Ensures the silent Android notification channel with PUBLIC lock screen visibility exists.
 */
export async function ensurePerlitaLockScreenChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(
      PERLITA_LOCKSCREEN_CHANNEL_ID,
      {
        name: 'Perlita en Pantalla de Bloqueo',
        description:
          'Muestra el versículo y reflexión diaria de forma silenciosa en la pantalla de bloqueo',
        importance: Notifications.AndroidImportance.LOW,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: false,
        enableLights: false,
        showBadge: false,
        sound: null,
      }
    );
  } catch (err) {
    console.warn('[PerlitaWidget] Failed to setup lockscreen channel:', err);
  }
}

/**
 * Checks whether the user has enabled the Lock Screen Perlita card on Android.
 */
export async function isLockScreenPerlitaEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const val = await SecureStore.getItemAsync(LOCKSCREEN_ENABLED_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Publishes or updates the persistent silent notification visible on the Android Lock Screen.
 */
export async function publishPerlitaToLockScreen(
  perlita: Perlita,
  isRandom = false
): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return false;
    }

    await ensurePerlitaLockScreenChannel();

    const title = `${isRandom ? '✦ Perlita de Guardia' : '✦ Perlita del Día'} • ${perlita.reference || 'Josué 1:9'}`;
    const attributionLine = perlita.attribution
      ? `\n— ${perlita.attribution}`
      : '';
    const body = `“${perlita.text}”${attributionLine}`;

    // Dismiss previous instance to update cleanly without alerting
    await Notifications.dismissNotificationAsync(
      LOCKSCREEN_NOTIFICATION_ID
    ).catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier: LOCKSCREEN_NOTIFICATION_ID,
      content: {
        title,
        body,
        color: '#0B192C',
        sticky: true,
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
        data: {
          type: 'PERLITA_LOCKSCREEN',
          reference: perlita.reference,
        },
        ...(Platform.OS === 'android'
          ? { channelId: PERLITA_LOCKSCREEN_CHANNEL_ID }
          : {}),
      } as Notifications.NotificationContentInput,
      trigger: null,
    });

    // Also ensure a daily morning refresh trigger at 07:00 AM is scheduled
    await Notifications.cancelScheduledNotificationAsync(
      LOCKSCREEN_DAILY_SCHEDULE_ID
    ).catch(() => {});
    const tomorrowPerlita = getDeterministicForcePerlita();
    await Notifications.scheduleNotificationAsync({
      identifier: LOCKSCREEN_DAILY_SCHEDULE_ID,
      content: {
        title: `✦ Perlita del Día • ${tomorrowPerlita.reference}`,
        body: `“${tomorrowPerlita.text}”`,
        color: '#0B192C',
        sticky: true,
        autoDismiss: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
        data: {
          type: 'PERLITA_LOCKSCREEN_DAILY',
        },
        ...(Platform.OS === 'android'
          ? { channelId: PERLITA_LOCKSCREEN_CHANNEL_ID }
          : {}),
      } as Notifications.NotificationContentInput,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 7,
        minute: 0,
        channelId: PERLITA_LOCKSCREEN_CHANNEL_ID,
      },
    }).catch(() => {});

    return true;
  } catch (err) {
    console.warn('[PerlitaWidget] Failed to publish lockscreen perlita:', err);
    return false;
  }
}

/**
 * Toggles the Android Lock Screen Perlita persistent card on or off.
 */
export async function toggleLockScreenPerlita(
  currentPerlita?: Perlita | null
): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const currentlyEnabled = await isLockScreenPerlitaEnabled();

  if (currentlyEnabled) {
    try {
      await SecureStore.setItemAsync(LOCKSCREEN_ENABLED_KEY, 'false');
      await Notifications.dismissNotificationAsync(
        LOCKSCREEN_NOTIFICATION_ID
      ).catch(() => {});
      await Notifications.cancelScheduledNotificationAsync(
        LOCKSCREEN_DAILY_SCHEDULE_ID
      ).catch(() => {});
    } catch {
      // Ignore
    }
    return false;
  }

  const targetPerlita = currentPerlita || getDeterministicForcePerlita();
  const published = await publishPerlitaToLockScreen(targetPerlita, false);
  if (published) {
    await SecureStore.setItemAsync(LOCKSCREEN_ENABLED_KEY, 'true').catch(
      () => {}
    );
    return true;
  }
  return false;
}

/**
 * Syncs the given Perlita with the Android Home Screen Widget and (if enabled) Lock Screen.
 */
export async function syncPerlitaToAndroidWidget(
  perlita: Perlita,
  isRandom = false
): Promise<void> {
  if (Platform.OS !== 'android') return;

  await saveStoredWidgetPerlita(perlita, isRandom);

  try {
    await requestWidgetUpdate({
      widgetName: PERLITA_WIDGET_NAME,
      renderWidget: () => (
        <PerlitaAndroidWidget perlita={perlita} isRandom={isRandom} />
      ),
      widgetNotFound: () => {
        // No widget placed on home screen yet; safe no-op
      },
    });
  } catch {
    // Safe fallback if running in Expo Go or before native rebuild
  }

  const lockScreenActive = await isLockScreenPerlitaEnabled();
  if (lockScreenActive) {
    await publishPerlitaToLockScreen(perlita, isRandom);
  }
}

/**
 * Requests the Android Launcher to pin the Perlita Widget directly onto the Home Screen.
 */
export async function pinPerlitaWidgetToHomeScreen(
  perlita?: Perlita | null
): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (perlita) {
    await saveStoredWidgetPerlita(perlita, false);
  }
  try {
    return await requestPinWidget({
      widgetName: PERLITA_WIDGET_NAME,
    });
  } catch {
    return false;
  }
}

/**
 * Background headless task handler invoked by Android AppWidgetProvider lifecycle events.
 */
export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps
): Promise<void> {
  const { widgetAction, clickAction, renderWidget } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const { perlita, isRandom } = await loadStoredWidgetPerlita();
      renderWidget(
        <PerlitaAndroidWidget perlita={perlita} isRandom={isRandom} />
      );
      break;
    }

    case 'WIDGET_CLICK': {
      if (clickAction === 'REFRESH_PERLITA' || clickAction === 'REFRESH') {
        const randomPerlita = getRandomForcePerlita();
        try {
          renderWidget(
            <PerlitaAndroidWidget perlita={randomPerlita} isRandom={true} />
          );
        } catch (renderErr) {
          console.warn('[PerlitaWidget] Error rendering widget on click:', renderErr);
        }

        try {
          await saveStoredWidgetPerlita(randomPerlita, true);
        } catch {}

        try {
          const lockScreenActive = await isLockScreenPerlitaEnabled();
          if (lockScreenActive) {
            await publishPerlitaToLockScreen(randomPerlita, true);
          }
        } catch {}
      }
      break;
    }

    case 'WIDGET_DELETED':
    default:
      break;
  }
}
