import * as FileSystem from 'expo-file-system/legacy';
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

const getSessionFilePath = () => `${FileSystem.documentDirectory || ''}auth_session.json`;
const getChaplainStatusFilePath = () => `${FileSystem.documentDirectory || ''}chaplain_status.json`;

export async function saveAuthSession(token: string, user: AuthUser): Promise<void> {
  inMemoryBackup = { token, user };
  try {
    if (FileSystem.documentDirectory) {
      await FileSystem.writeAsStringAsync(
        getSessionFilePath(),
        JSON.stringify({ token, user }),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
    }
  } catch (err) {
    console.warn('[Storage] Failed to persist session to disk:', err);
  }
}

export async function loadAuthSession(): Promise<StoredSession> {
  if (inMemoryBackup.token && inMemoryBackup.user) {
    return inMemoryBackup;
  }

  try {
    if (FileSystem.documentDirectory) {
      const filePath = getSessionFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(filePath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const parsed = JSON.parse(content) as StoredSession;
        if (parsed?.token && parsed?.user) {
          inMemoryBackup = parsed;
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to read session from disk:', err);
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
    if (FileSystem.documentDirectory) {
      const filePath = getSessionFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
      const statusFilePath = getChaplainStatusFilePath();
      const statusInfo = await FileSystem.getInfoAsync(statusFilePath);
      if (statusInfo.exists) {
        await FileSystem.deleteAsync(statusFilePath, { idempotent: true });
      }
    }
  } catch (err) {
    console.warn('[Storage] Failed to clear session file from disk:', err);
  }
}
