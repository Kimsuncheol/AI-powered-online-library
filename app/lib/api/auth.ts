'use client';

import type { Member } from '@/app/interfaces/member';
import { get, HttpError, post } from '@/app/lib/http';

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

interface SignInEnvelope {
  member?: Member;
  [key: string]: unknown;
}

function isMember(payload: unknown): payload is Member {
  return Boolean(payload) && typeof payload === 'object' && 'email' in (payload as Record<string, unknown>);
}

function extractMember(payload: unknown): Member {
  if (isMember(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'member' in payload) {
    const candidate = (payload as SignInEnvelope).member;
    if (isMember(candidate)) {
      return candidate;
    }
  }

  throw new Error('Invalid member response payload');
}

export async function signIn(payload: MemberLoginPayload): Promise<Member> {
  const result = await post<unknown>(SIGNIN_ENDPOINT, { json: payload });
  return extractMember(result);
}

export async function signUp(payload: MemberCreatePayload): Promise<Member> {
  const result = await post<unknown>(SIGNUP_ENDPOINT, { json: payload });
  return extractMember(result);
}

export async function signOut(): Promise<void> {
  try {
    await post<void>(SIGNOUT_ENDPOINT, {});
  } catch (error) {
    if (error instanceof HttpError && (error.status === 401 || error.status === 419)) {
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Sign-out request failed', error);
    }
  }
}

export async function readCurrentMember(): Promise<Member | null> {
  try {
    const result = await get<unknown>(ME_ENDPOINT, {});
    if (result === null || typeof result === 'undefined') {
      return null;
    }
    return extractMember(result);
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
