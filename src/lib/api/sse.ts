import { getApiBaseUrl } from './client';

export type SseEventListener = (data: any) => void;

export interface SseClientOptions {
  headers?: Record<string, string>;
  autoReconnect?: boolean;
  reconnectIntervalMs?: number;
  maxReconnectIntervalMs?: number;
}

/**
 * Lightweight SSE (Server-Sent Events) client for React Native.
 * Uses XMLHttpRequest progressive text streaming (onprogress) which
 * is natively supported across iOS, Android and Web without external binaries.
 */
export class SseClient {
  private endpoint: string;
  private options: SseClientOptions;
  private xhr: XMLHttpRequest | null = null;
  private listeners: Map<string, Set<SseEventListener>> = new Map();
  private isExplicitlyClosed: boolean = false;
  private processedLength: number = 0;
  private buffer: string = '';
  private currentEvent: string = 'message';
  private currentData: string[] = [];
  private reconnectTimeout: any = null;
  private currentRetryDelay: number;

  constructor(endpoint: string, options: SseClientOptions = {}) {
    this.endpoint = endpoint;
    this.options = {
      autoReconnect: true,
      reconnectIntervalMs: 3000,
      maxReconnectIntervalMs: 20000,
      ...options,
    };
    this.currentRetryDelay = this.options.reconnectIntervalMs || 3000;
  }

  public addEventListener(event: string, listener: SseEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.removeEventListener(event, listener);
    };
  }

  public removeEventListener(event: string, listener: SseEventListener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private dispatchEvent(event: string, rawData: string) {
    let parsedData = rawData;
    try {
      parsedData = JSON.parse(rawData);
    } catch {
      // Keep as string if not valid JSON
    }

    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(parsedData);
        } catch (e) {
          console.warn(`[SSE] Listener error on event "${event}":`, e);
        }
      });
    }
  }

  public connect() {
    if (this.xhr) {
      this.close();
    }

    this.isExplicitlyClosed = false;
    this.processedLength = 0;
    this.buffer = '';
    this.currentEvent = 'message';
    this.currentData = [];

    const baseUrl = getApiBaseUrl();
    const fullUrl = this.endpoint.startsWith('http')
      ? this.endpoint
      : `${baseUrl}${this.endpoint}`;

    try {
      const xhr = new XMLHttpRequest();
      this.xhr = xhr;

      xhr.open('GET', fullUrl, true);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');

      if (this.options.headers) {
        for (const [key, value] of Object.entries(this.options.headers)) {
          if (value) {
            xhr.setRequestHeader(key, value);
          }
        }
      }

      xhr.onprogress = () => {
        if (this.isExplicitlyClosed || xhr !== this.xhr) return;
        const text = xhr.responseText || '';
        if (text.length > this.processedLength) {
          const newChunk = text.substring(this.processedLength);
          this.processedLength = text.length;
          this.parseChunk(newChunk);
        }
      };

      xhr.onload = () => {
        if (this.isExplicitlyClosed || xhr !== this.xhr) return;
        // Stream completed or server closed connection
        this.dispatchEvent('close', 'closed');
        this.scheduleReconnect();
      };

      xhr.onerror = (e) => {
        if (this.isExplicitlyClosed || xhr !== this.xhr) return;
        console.warn(`[SSE] Connection error on ${this.endpoint}:`, e);
        this.dispatchEvent('error', 'error');
        this.scheduleReconnect();
      };

      xhr.send();
      this.currentRetryDelay = this.options.reconnectIntervalMs || 3000;
    } catch (err) {
      console.warn(`[SSE] Failed to initialize connection to ${fullUrl}:`, err);
      this.scheduleReconnect();
    }
  }

  private parseChunk(chunk: string) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r\n|\r|\n/);
    // Keep the last incomplete line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() === '') {
        // Empty line signifies dispatch of current event block
        if (this.currentData.length > 0) {
          const payload = this.currentData.join('\n');
          this.dispatchEvent(this.currentEvent, payload);
          this.currentData = [];
          this.currentEvent = 'message';
        }
      } else if (line.startsWith(':')) {
        // Comment / ping keep-alive line, ignore or dispatch ping
        const comment = line.slice(1).trim();
        if (comment === 'ping') {
          this.dispatchEvent('ping', 'ping');
        }
      } else if (line.startsWith('event:')) {
        this.currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        this.currentData.push(line.slice(5).trim());
      }
    }
  }

  private scheduleReconnect() {
    if (this.isExplicitlyClosed || !this.options.autoReconnect) return;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.currentRetryDelay = Math.min(
          this.currentRetryDelay * 1.5,
          this.options.maxReconnectIntervalMs || 20000
        );
        this.connect();
      }
    }, this.currentRetryDelay);
  }

  public close() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.xhr) {
      try {
        this.xhr.abort();
      } catch {
        // Ignored
      }
      this.xhr = null;
    }
  }
}
