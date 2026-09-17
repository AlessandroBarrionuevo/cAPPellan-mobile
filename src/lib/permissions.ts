import { PermissionsAndroid, Platform, Alert } from 'react-native';

export interface MediaPermissionsResult {
  camera: boolean;
  microphone: boolean;
}

/**
 * Requests camera and microphone permissions at runtime.
 * Android requires explicit runtime requests.
 * iOS and Web prompt via the WebRTC media pipeline.
 */
export async function requestMediaPermissions(
  requireCamera: boolean = true
): Promise<MediaPermissionsResult> {
  if (Platform.OS !== 'android') {
    return { camera: true, microphone: true };
  }

  try {
    const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (requireCamera) {
      permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    }

    const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);

    const microphone =
      granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const camera = requireCamera
      ? granted[PermissionsAndroid.PERMISSIONS.CAMERA] ===
        PermissionsAndroid.RESULTS.GRANTED
      : false;

    if (!microphone) {
      Alert.alert(
        'Permiso de Micrófono Requerido',
        'Para comunicarte con el capellán de guardia, la aplicación necesita acceso al micrófono. Podés habilitarlo en los Ajustes de tu dispositivo.',
        [{ text: 'Entendido' }]
      );
    }

    return { camera, microphone };
  } catch (err) {
    console.warn('[Permissions] Error requesting media permissions:', err);
    return { camera: false, microphone: false };
  }
}

/**
 * Checks whether camera and microphone permissions are already granted.
 */
export async function checkMediaPermissions(): Promise<MediaPermissionsResult> {
  if (Platform.OS !== 'android') {
    return { camera: true, microphone: true };
  }

  try {
    const [hasCamera, hasMic] = await Promise.all([
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA),
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO),
    ]);

    return { camera: hasCamera, microphone: hasMic };
  } catch {
    return { camera: false, microphone: false };
  }
}
