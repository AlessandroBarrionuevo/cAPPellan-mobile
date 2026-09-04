import { Platform, Alert } from 'react-native';

let hasRequestedPermission = false;

export async function requestNotificationPermissionAndScheduleReminder(): Promise<boolean> {
  if (hasRequestedPermission) return false;
  hasRequestedPermission = true;

  try {
    // Dynamic import to avoid crashes if native module is not linked in development
    const Notifications = await import('expo-notifications');

    if (Notifications?.requestPermissionsAsync) {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Schedule single service reminder notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'CapellanAPP ✨',
            body: 'Gracias por tu servicio y dedicación. Que tengas una jornada bendecida.',
            sound: true,
          },
          trigger: {
            seconds: 60 * 60 * 4, // 4 hours later as a gentle reminder
          },
        });
        return true;
      }
    }
  } catch (error) {
    // Fallback or dev client notice
    console.log('[Notifications] Push/local notifications not available in this environment:', error);
  }

  return false;
}
