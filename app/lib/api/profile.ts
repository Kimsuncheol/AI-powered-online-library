'use client';

import type { Member } from '@/app/interfaces/member';
import { del, get, HttpError, patch as httpPatch } from '@/app/lib/http';

const PROFILE_ENDPOINT = '/profile/me';

export interface MemberUpdatePayload {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  preferredGenres?: string[];
  avatarUrl?: string | null;
}

export async function readProfile(): Promise<Member> {
  return get<Member>(PROFILE_ENDPOINT);
}

export async function updateProfile(payload: MemberUpdatePayload): Promise<Member> {
  return httpPatch<Member>(PROFILE_ENDPOINT, { json: payload });
}

export async function deleteProfile(): Promise<void> {
  try {
    await del<void>(PROFILE_ENDPOINT);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return;
    }
    throw error;
  }
}
