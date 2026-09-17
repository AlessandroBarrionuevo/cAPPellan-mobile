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
let activeClientToken: string | null = null;
let activeAuthToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setApiBaseUrl(url: string) {
  customBaseUrl = url;
}

export function getApiBaseUrl() {
  return customBaseUrl;
}

export function setAuthToken(token: string | null) {
  activeAuthToken = token;
}

export function getAuthToken(): string | null {
  return activeAuthToken;
}

export function setOnUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorizedCallback = handler;
}

export function setClientToken(token: string | null) {
  activeClientToken = token;
}

export function getClientToken(): string | null {
  return activeClientToken;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = activeAuthToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
    ...(activeClientToken ? { 'X-Client-Token': activeClientToken } : {}),
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

    let message = body?.error || response.statusText || 'Unknown error';
    if (response.status === 429) {
      message = body?.error || 'Demasiadas peticiones. Por favor, aguardá unos segundos antes de reintentar.';
    } else if (response.status === 409) {
      message = body?.error || 'El período de reconexión expiró o la sesión ya finalizó.';
    }

    const error = new ApiError(message, response.status, body);

    if (response.status === 401 && token) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    throw error;
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return undefined as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    return text as unknown as T;
  }
}
