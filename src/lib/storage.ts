import type { AuthUser } from '../types/api';

interface StoredSession {
  token: string | null;
  user: AuthUser | null;
}

let inMemoryBackup: StoredSession = {
  token: null,
  user: null,
};

export async function saveAuthSession(token: string, user: AuthUser): Promise<void> {
  inMemoryBackup = { token, user };
}

export async function loadAuthSession(): Promise<StoredSession> {
  return inMemoryBackup;
}

export async function clearAuthSession(): Promise<void> {
  inMemoryBackup = { token: null, user: null };
}
