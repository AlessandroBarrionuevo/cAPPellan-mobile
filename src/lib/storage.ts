import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../types/api';

interface StoredSession {
  token: string | null;
  user: AuthUser | null;
}

let inMemoryBackup: StoredSession = {
  token: null,
  user: null,
};

let inMemoryChaplainStatus: 'ONLINE' | 'OFFLINE' = 'OFFLINE';

const SECURE_TOKEN_KEY = 'capellan_auth_token';
const getUserProfileFilePath = () => `${FileSystem.documentDirectory || ''}user_profile.json`;
const getLegacySessionFilePath = () => `${FileSystem.documentDirectory || ''}auth_session.json`;
const getChaplainStatusFilePath = () => `${FileSystem.documentDirectory || ''}chaplain_status.json`;

/**
 * Persist the authentication session:
 * - JWT token is encrypted in hardware-backed secure storage (Android Keystore / iOS Keychain).
 * - Non-sensitive user profile metadata is saved to local JSON.
 * - Any legacy plaintext auth_session.json is securely purged.
 */
export async function saveAuthSession(token: string, user: AuthUser): Promise<void> {
  inMemoryBackup = { token, user };
  try {
    // 1. Store JWT in hardware-backed SecureStore (Android Keystore / iOS Keychain)
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });

    // 2. Store non-sensitive user profile metadata
    if (FileSystem.documentDirectory) {
      await FileSystem.writeAsStringAsync(
        getUserProfileFilePath(),
        JSON.stringify(user),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      // 3. Purge legacy plaintext session file if it existed
      const legacyPath = getLegacySessionFilePath();
      const legacyInfo = await FileSystem.getInfoAsync(legacyPath);
      if (legacyInfo.exists) {
        await FileSystem.deleteAsync(legacyPath, { idempotent: true });
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to persist secure session:', err);
  }
}

/**
 * Load the authentication session:
 * - Reads JWT from hardware-backed SecureStore.
 * - Reads user profile metadata from local storage.
 * - Gracefully migrates from legacy plaintext storage if needed.
 */
export async function loadAuthSession(): Promise<StoredSession> {
  if (inMemoryBackup.token && inMemoryBackup.user) {
    return inMemoryBackup;
  }

  try {
    // 1. Attempt reading token from SecureStore
    const secureToken = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);

    let profileUser: AuthUser | null = null;
    if (FileSystem.documentDirectory) {
      const userFilePath = getUserProfileFilePath();
      const userInfo = await FileSystem.getInfoAsync(userFilePath);
      if (userInfo.exists) {
        const content = await FileSystem.readAsStringAsync(userFilePath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        profileUser = JSON.parse(content) as AuthUser;
      }
    }

    if (secureToken && profileUser) {
      inMemoryBackup = { token: secureToken, user: profileUser };
      return inMemoryBackup;
    }

    // 2. Migration fallback: Check if legacy plaintext auth_session.json exists
    if (FileSystem.documentDirectory) {
      const legacyPath = getLegacySessionFilePath();
      const legacyInfo = await FileSystem.getInfoAsync(legacyPath);
      if (legacyInfo.exists) {
        const content = await FileSystem.readAsStringAsync(legacyPath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const parsed = JSON.parse(content) as StoredSession;
        if (parsed?.token && parsed?.user) {
          // Migrate token into SecureStore and delete plaintext legacy file
          await saveAuthSession(parsed.token, parsed.user);
          return inMemoryBackup;
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to read secure session:', err);
  }

  return inMemoryBackup;
}

export async function saveChaplainStatus(status: 'ONLINE' | 'OFFLINE'): Promise<void> {
  inMemoryChaplainStatus = status;
  try {
    if (FileSystem.documentDirectory) {
      await FileSystem.writeAsStringAsync(
        getChaplainStatusFilePath(),
        JSON.stringify({ status }),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
    }
  } catch (err) {
    console.warn('[Storage] Failed to persist chaplain status to disk:', err);
  }
}

export async function loadChaplainStatus(): Promise<'ONLINE' | 'OFFLINE'> {
  try {
    if (FileSystem.documentDirectory) {
      const filePath = getChaplainStatusFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(filePath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const parsed = JSON.parse(content) as { status?: string };
        if (parsed?.status === 'ONLINE' || parsed?.status === 'OFFLINE') {
          inMemoryChaplainStatus = parsed.status;
          return parsed.status;
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to read chaplain status from disk:', err);
  }
  return inMemoryChaplainStatus;
}

export async function clearAuthSession(): Promise<void> {
  inMemoryBackup = { token: null, user: null };
  inMemoryChaplainStatus = 'OFFLINE';
  try {
    // 1. Delete token from SecureStore
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);

    if (FileSystem.documentDirectory) {
      // 2. Delete user profile
      const userFilePath = getUserProfileFilePath();
      const userInfo = await FileSystem.getInfoAsync(userFilePath);
      if (userInfo.exists) {
        await FileSystem.deleteAsync(userFilePath, { idempotent: true });
      }

      // 3. Delete legacy session file if present
      const legacyPath = getLegacySessionFilePath();
      const legacyInfo = await FileSystem.getInfoAsync(legacyPath);
      if (legacyInfo.exists) {
        await FileSystem.deleteAsync(legacyPath, { idempotent: true });
      }

      // 4. Delete chaplain status
      const statusFilePath = getChaplainStatusFilePath();
      const statusInfo = await FileSystem.getInfoAsync(statusFilePath);
      if (statusInfo.exists) {
        await FileSystem.deleteAsync(statusFilePath, { idempotent: true });
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to clear session from storage:', err);
  }
}
