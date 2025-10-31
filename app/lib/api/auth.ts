'use client';

import type { Member } from '@/app/interfaces/member';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const SIGNIN_ENDPOINT = '/auth/signin';
const SIGNUP_ENDPOINT = '/auth/signup';
const SIGNOUT_ENDPOINT = '/auth/signout';
const ME_ENDPOINT = '/auth/me';

export interface MemberCreatePayload {
  email: string;
  password: string;
  displayName: string;
}

export interface MemberLoginPayload {
  email: string;
  password: string;
}

export interface SignInResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  member: Member;
}

export interface TokenBundle {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
}

export class APIError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

function resolveUrl(path: string) {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  if (response.status === 204) {
    return undefined as T;
  }

  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return parseResponse<T>(response);
  }

  let details: unknown;
  try {
    details = await parseResponse(response);
  } catch {
    // ignore json parse failure
  }

  const message = extractDetailMessage(details) ?? response.statusText ?? 'Request failed';

  throw new APIError(message, response.status, details);
}

function extractDetailMessage(details: unknown): string | undefined {
  if (typeof details !== 'object' || details === null || !('detail' in details)) {
    return undefined;
  }

  const detail = (details as { detail?: unknown }).detail;
  return typeof detail === 'string' ? detail : undefined;
}

const ACCESS_TOKEN_KEY = 'ai-library.accessToken';
const REFRESH_TOKEN_KEY = 'ai-library.refreshToken';
const TOKEN_TYPE_KEY = 'ai-library.tokenType';

function persistTokens(bundle: TokenBundle | null) {
  if (!bundle) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(TOKEN_TYPE_KEY);
    }
    return;
  }

  if (typeof window === 'undefined') return;

  localStorage.setItem(ACCESS_TOKEN_KEY, bundle.accessToken);
  if (bundle.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, bundle.refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  if (bundle.tokenType) {
    localStorage.setItem(TOKEN_TYPE_KEY, bundle.tokenType);
  }
}

export function getStoredAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearStoredTokens() {
  persistTokens(null);
}

export async function signIn(payload: MemberLoginPayload): Promise<Member> {
  const response = await fetch(resolveUrl(SIGNIN_ENDPOINT), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<SignInResponse>(response);
  persistTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tokenType: data.tokenType,
  });
  return data.member;
}

export async function signUp(payload: MemberCreatePayload): Promise<Member> {
  const response = await fetch(resolveUrl(SIGNUP_ENDPOINT), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const member = await handleResponse<Member>(response);
  return member;
}

export async function signOut(): Promise<void> {
  await fetch(resolveUrl(SIGNOUT_ENDPOINT), {
    method: 'POST',
  }).catch(() => {
    // ignore network errors for sign-out
  });
  clearStoredTokens();
}

export async function readCurrentMember(): Promise<Member | null> {
  const token = getStoredAccessToken();
  if (!token) return null;

  const response = await fetch(resolveUrl(ME_ENDPOINT), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearStoredTokens();
    return null;
  }

  const member = await handleResponse<Member>(response);
  return member;
}
