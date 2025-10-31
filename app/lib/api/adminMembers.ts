'use client';

import type { Member } from '@/app/interfaces/member';
import type { MemberCreatePayload } from '@/app/lib/api/auth';
import type { MemberUpdatePayload } from '@/app/lib/api/profile';
import { del, get, patch as httpPatch, post } from '@/app/lib/http';

export type MemberOut = Member;
export type MemberCreate = MemberCreatePayload;
export type MemberUpdate = MemberUpdatePayload;

const MEMBERS_ENDPOINT = '/admin/members';

export async function listMembers(params?: {
  skip?: number;
  limit?: number;
  search?: string | null;
}): Promise<MemberOut[]> {
  const query = new URLSearchParams();
  if (typeof params?.skip === 'number') query.set('skip', String(params.skip));
  if (typeof params?.limit === 'number') query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);

  const endpoint = `${MEMBERS_ENDPOINT}${query.toString() ? `?${query.toString()}` : ''}`;
  return get<MemberOut[]>(endpoint);
}

export async function getMember(memberId: string): Promise<MemberOut> {
  return get<MemberOut>(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`);
}

export async function createMember(payload: MemberCreate): Promise<MemberOut> {
  return post<MemberOut>(MEMBERS_ENDPOINT, { json: payload });
}

export async function updateMember(memberId: string, payload: MemberUpdate): Promise<MemberOut> {
  return httpPatch<MemberOut>(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`, { json: payload });
}

export async function deleteMember(memberId: string): Promise<void> {
  await del<void>(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`);
}
