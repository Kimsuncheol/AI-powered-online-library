'use client';

import type { Member } from '@/app/interfaces/member';
import type { MemberCreatePayload } from '@/app/lib/api/auth';
import type { MemberUpdatePayload } from '@/app/lib/api/profile';
import { clearStoredTokens, getStoredAccessToken } from '@/app/lib/api/auth';

export type MemberOut = Member;
export type MemberCreate = MemberCreatePayload;
export type MemberUpdate = MemberUpdatePayload;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const MEMBERS_ENDPOINT = '/admin/members';

function resolveUrl(path: string) {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}

function buildAuthHeaders(): Headers {
  const token = getStoredAccessToken();
  const headers = new Headers();
  if (!token) {
    throw new Error('Unauthorized');
  }
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

async function parseError(response: Response): Promise<Error> {
  let message = response.statusText || 'Request failed';
  try {
    const data = await response.json();
    if (data && typeof data === 'object') {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        const firstDetail = data.detail[0];
        if (firstDetail && typeof firstDetail.msg === 'string') {
          message = firstDetail.msg;
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  return new Error(message);
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = buildAuthHeaders();
  const mergedHeaders = new Headers(init?.headers ?? undefined);
  mergedHeaders.forEach((value, key) => headers.set(key, value));

  const response = await fetch(resolveUrl(input), {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    clearStoredTokens();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listMembers(params?: {
  skip?: number;
  limit?: number;
  search?: string | null;
}): Promise<MemberOut[]> {
  const query = new URLSearchParams();
  if (params?.skip !== undefined) query.set('skip', String(params.skip));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);

  const endpoint = `${MEMBERS_ENDPOINT}${query.toString() ? `?${query.toString()}` : ''}`;

  return request<MemberOut[]>(endpoint, {
    method: 'GET',
  });
}

export async function getMember(memberId: string): Promise<MemberOut> {
  return request<MemberOut>(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`, {
    method: 'GET',
  });
}

export async function createMember(payload: MemberCreate): Promise<MemberOut> {
  return request<MemberOut>(MEMBERS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function updateMember(memberId: string, payload: MemberUpdate): Promise<MemberOut> {
  return request<MemberOut>(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteMember(memberId: string): Promise<void> {
  await request<void>(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  });
}
