'use client';

import type { Member } from '@/app/interfaces/member';
import {
  APIError,
  clearStoredTokens,
  getStoredAccessToken,
  handleResponse,
  resolveUrl,
} from '@/app/lib/api/auth';

export type MemberOut = Member;
export type MemberCreate = Pick<Member, 'email' | 'displayName' | 'role' | 'avatarUrl' | 'bio' | 'location'>;
export type MemberUpdate = Partial<Omit<MemberCreate, 'email'>> & { role?: Member['role'] };

const MEMBERS_ENDPOINT = '/admin/members';
const LOGIN_REDIRECT = '/login?next=/admin/members';

function ensureAuthHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const token = getStoredAccessToken();

  if (!token) {
    throw new APIError('Authentication required', 401);
  }

  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

function redirectToLogin() {
  clearStoredTokens();
  if (typeof window !== 'undefined') {
    window.location.assign(LOGIN_REDIRECT);
  }
}

async function handleMembersResponse<T>(response: Response): Promise<T> {
  if (response.status === 401 || response.status === 403) {
    redirectToLogin();
    throw new APIError('Authentication required', response.status);
  }

  return handleResponse<T>(response);
}

async function membersFetch(input: string, init: RequestInit = {}): Promise<Response> {
  try {
    const headers = ensureAuthHeaders(init.headers);
    return await fetch(resolveUrl(input), {
      ...init,
      headers,
    });
  } catch (error) {
    if (error instanceof APIError && (error.status === 401 || error.status === 403)) {
      redirectToLogin();
    }
    throw error;
  }
}

export async function listMembers(skip?: number, limit?: number, search?: string): Promise<MemberOut[]> {
  const params = new URLSearchParams();
  if (typeof skip === 'number' && skip > 0) params.set('skip', String(skip));
  if (typeof limit === 'number' && limit > 0) params.set('limit', String(limit));
  if (search && search.trim().length > 0) params.set('search', search.trim());

  const query = params.toString();

  const response = await membersFetch(`${MEMBERS_ENDPOINT}${query ? `?${query}` : ''}`, {
    method: 'GET',
  });

  const totalHeader = response.headers.get('x-total-count') ?? response.headers.get('x-total');
  const members = await handleMembersResponse<MemberOut[]>(response);

  if (totalHeader) {
    const parsed = Number(totalHeader);
    if (!Number.isNaN(parsed)) {
      (members as MemberOut[] & { total?: number }).total = parsed;
    }
  }

  return members;
}

export async function getMember(memberId: string): Promise<MemberOut> {
  const response = await membersFetch(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`, {
    method: 'GET',
  });

  return handleMembersResponse<MemberOut>(response);
}

export async function createMember(payload: MemberCreate): Promise<MemberOut> {
  const response = await membersFetch(`${MEMBERS_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleMembersResponse<MemberOut>(response);
}

export async function updateMember(memberId: string, payload: MemberUpdate): Promise<MemberOut> {
  const response = await membersFetch(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleMembersResponse<MemberOut>(response);
}

export async function deleteMember(memberId: string): Promise<void> {
  const response = await membersFetch(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  });

  await handleMembersResponse<void>(response);
}
