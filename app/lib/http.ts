'use client';

export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export interface UnauthorizedEventDetail {
  status: number;
  url: string;
  fromInteraction: boolean;
  timestamp: number;
}

export class HttpError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export interface HttpRequestOptions extends RequestInit {
  json?: unknown;
  onResponse?: (response: Response) => void;
  suppressUnauthorizedEvent?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

let interactionsTracked = false;
let lastInteractionAt: number | null = null;

function resolveUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) {
    return input;
  }
  if (!API_BASE_URL) {
    return input;
  }
  return `${API_BASE_URL}${input}`;
}

function ensureInteractionTracking() {
  if (interactionsTracked || typeof window === 'undefined') {
    return;
  }

  const recordInteraction = () => {
    lastInteractionAt = Date.now();
  };

  window.addEventListener('pointerdown', recordInteraction, true);
  window.addEventListener('keydown', recordInteraction, true);
  window.addEventListener('submit', recordInteraction, true);

  interactionsTracked = true;
}

function getHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init ?? undefined);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  return headers;
}

function buildUnauthorizedDetail(status: number, url: string): UnauthorizedEventDetail {
  const now = Date.now();
  const fromInteraction = typeof lastInteractionAt === 'number' ? now - lastInteractionAt <= 2000 : false;
  return {
    status,
    url,
    fromInteraction,
    timestamp: now,
  };
}

function dispatchUnauthorized(detail: UnauthorizedEventDetail) {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent<UnauthorizedEventDetail>(UNAUTHORIZED_EVENT, { detail }));
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  try {
    const text = await response.text();
    return text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
}

function extractMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.trim().length > 0) {
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return record.message;
    }
    if (typeof record.detail === 'string') {
      return record.detail;
    }
    if (typeof record.error === 'string') {
      return record.error;
    }
  }

  return fallback || 'Request failed';
}

export async function fetchJson<T>(input: string, options: HttpRequestOptions = {}): Promise<T> {
  ensureInteractionTracking();

  const { json, headers: initHeaders, body: initBody, onResponse, suppressUnauthorizedEvent, ...rest } = options;
  const headers = getHeaders(initHeaders);

  let body: BodyInit | null | undefined = initBody as BodyInit | null | undefined;

  if (json !== undefined) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(json);
  }

  const response = await fetch(resolveUrl(input), {
    ...rest,
    method: rest.method,
    headers,
    body,
    credentials: 'include',
  });

  onResponse?.(response);

  const data = (await parseBody(response)) as T;

  if (response.status === 401 || response.status === 419) {
    if (!suppressUnauthorizedEvent) {
      dispatchUnauthorized(buildUnauthorizedDetail(response.status, input));
    }
    throw new HttpError('Unauthorized', response.status, data);
  }

  if (!response.ok) {
    const message = extractMessage(data, response.statusText);
    throw new HttpError(message, response.status, data);
  }

  return data;
}

export async function get<T>(input: string, options: HttpRequestOptions = {}): Promise<T> {
  return fetchJson<T>(input, { ...options, method: 'GET' });
}

export async function post<T>(input: string, options: HttpRequestOptions = {}): Promise<T> {
  return fetchJson<T>(input, { ...options, method: 'POST' });
}

export async function patch<T>(input: string, options: HttpRequestOptions = {}): Promise<T> {
  return fetchJson<T>(input, { ...options, method: 'PATCH' });
}

export async function del<T>(input: string, options: HttpRequestOptions = {}): Promise<T> {
  return fetchJson<T>(input, { ...options, method: 'DELETE' });
}

export type UnauthorizedSubscriber = (detail: UnauthorizedEventDetail) => void;

export function subscribeUnauthorized(listener: UnauthorizedSubscriber): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  ensureInteractionTracking();

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<UnauthorizedEventDetail | undefined>).detail ?? buildUnauthorizedDetail(401, window.location.pathname);
    listener(detail);
  };

  window.addEventListener(UNAUTHORIZED_EVENT, handler);

  return () => {
    window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  };
}
