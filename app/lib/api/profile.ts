'use client';

import type { Member } from '@/app/interfaces/member';
import { APIError, clearStoredTokens, getStoredAccessToken, handleResponse, resolveUrl } from '@/app/lib/api/auth';

const PROFILE_ENDPOINT = '/profile/me';

export interface MemberUpdatePayload {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  preferredGenres?: string[];
  avatarUrl?: string | null;
}

async function authorizedFetch(input: string, init: RequestInit = {}) {
  const token = getStoredAccessToken();
  if (!token) {
    throw new APIError('Authentication required', 401);
  }

  const headers = new Headers(init.headers ?? undefined);
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(resolveUrl(input), {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearStoredTokens();
    throw new APIError('Authentication required', 401, await response.json().catch(() => undefined));
  }

  return response;
}

export async function readProfile(): Promise<Member> {
  const response = await authorizedFetch(PROFILE_ENDPOINT, {
    method: 'GET',
  });

  const member = await handleResponse<Member>(response);
  return member;
}

export async function updateProfile(payload: MemberUpdatePayload): Promise<Member> {
  const response = await authorizedFetch(PROFILE_ENDPOINT, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const member = await handleResponse<Member>(response);
  return member;
}

export async function deleteProfile(): Promise<void> {
  const response = await authorizedFetch(PROFILE_ENDPOINT, {
    method: 'DELETE',
  });

  if (response.status === 204) {
    clearStoredTokens();
    return;
  }

  await handleResponse<never>(response);
}
