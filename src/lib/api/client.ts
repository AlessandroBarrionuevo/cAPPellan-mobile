import { useAuthStore } from '../stores/auth';
import { ENV } from '../../config/env';

export class ApiError extends Error {
  status: number;
  body?: any;

  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

let customBaseUrl = ENV.API_BASE_URL;

export function setApiBaseUrl(url: string) {
  customBaseUrl = url;
}

export function getApiBaseUrl() {
  return customBaseUrl;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const url = `${customBaseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let body: { error?: string } | undefined;
    try {
      body = await response.json();
    } catch {
      // Body not json
    }

    const message = body?.error || response.statusText || 'Unknown error';
    const error = new ApiError(message, response.status, body);

    if (response.status === 401) {
      useAuthStore.getState().logout();
    }

    throw error;
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}
