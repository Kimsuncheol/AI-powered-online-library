'use client';

import type { Member } from '@/app/interfaces/member';
import { del, get, patch as httpPatch, post } from '@/app/lib/http';

export type MemberOut = Member;
export type MemberCreate = Pick<Member, 'email' | 'displayName' | 'role' | 'avatarUrl' | 'bio' | 'location'>;
export type MemberUpdate = Partial<Omit<MemberCreate, 'email'>> & { role?: Member['role'] };

const MEMBERS_ENDPOINT = '/admin/members';

export async function listMembers(skip?: number, limit?: number, search?: string): Promise<MemberOut[]> {
  const params = new URLSearchParams();
  if (typeof skip === 'number' && skip > 0) params.set('skip', String(skip));
  if (typeof limit === 'number' && limit > 0) params.set('limit', String(limit));
  if (search && search.trim().length > 0) params.set('search', search.trim());

  const query = params.toString();
  let totalHeaderValue: number | undefined;

  const members = await get<MemberOut[]>(`${MEMBERS_ENDPOINT}${query ? `?${query}` : ''}`, {
    onResponse: (response) => {
      const rawTotal = response.headers.get('x-total-count') ?? response.headers.get('x-total');
      if (rawTotal) {
        const parsed = Number(rawTotal);
        if (!Number.isNaN(parsed)) {
          totalHeaderValue = parsed;
        }
      }
    },
  });

  if (typeof totalHeaderValue === 'number') {
    (members as MemberOut[] & { total?: number }).total = totalHeaderValue;
  }

  return members;
}

export async function getMember(memberId: string): Promise<MemberOut> {
  return get<MemberOut>(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`);
}

export async function createMember(payload: MemberCreate): Promise<MemberOut> {
  return post<MemberOut>(`${MEMBERS_ENDPOINT}`, { json: payload });
}

export async function updateMember(memberId: string, payload: MemberUpdate): Promise<MemberOut> {
  return httpPatch<MemberOut>(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`, { json: payload });
}

export async function deleteMember(memberId: string): Promise<void> {
  await del<void>(`${MEMBERS_ENDPOINT}/${encodeURIComponent(memberId)}`);
}
