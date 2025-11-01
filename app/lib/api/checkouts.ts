'use client';

import type { CheckoutCreate, CheckoutOut, CheckoutUpdate } from '@/app/types/checkouts';
import { del, get, patch as httpPatch, post } from '@/app/lib/http';

const CHECKOUTS_ENDPOINT = '/checkouts';

type ListParams = {
  skip?: number;
  limit?: number;
  search?: string | null;
  memberId?: string | null;
  bookId?: string | null;
  status?: string | null;
  from?: string | null;
  to?: string | null;
};

function makeQuery(params?: ListParams): string {
  const query = new URLSearchParams();
  if (params) {
    const { skip, limit, search, memberId, bookId, status, from, to } = params;
    if (typeof skip === 'number' && skip >= 0) query.set('skip', String(skip));
    if (typeof limit === 'number' && limit > 0) query.set('limit', String(limit));
    if (typeof search === 'string' && search.trim().length > 0) query.set('search', search.trim());
    if (typeof memberId === 'string' && memberId.trim().length > 0) query.set('memberId', memberId.trim());
    if (typeof bookId === 'string' && bookId.trim().length > 0) query.set('bookId', bookId.trim());
    if (typeof status === 'string' && status.trim().length > 0) query.set('status', status.trim());
    if (typeof from === 'string' && from.trim().length > 0) query.set('from', from.trim());
    if (typeof to === 'string' && to.trim().length > 0) query.set('to', to.trim());
  }

  const queryString = query.toString();
  return queryString.length > 0 ? `?${queryString}` : '';
}

export async function createCheckout(payload: CheckoutCreate): Promise<CheckoutOut> {
  return post<CheckoutOut>(`${CHECKOUTS_ENDPOINT}/`, { json: payload });
}

export async function listCheckouts(params?: ListParams): Promise<CheckoutOut[]> {
  const query = makeQuery(params);
  const url = `${CHECKOUTS_ENDPOINT}${query}`;
  let totalHeaderValue: number | undefined;
  const items = await get<CheckoutOut[]>(url, {
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
    (items as CheckoutOut[] & { total?: number }).total = totalHeaderValue;
  }

  return items;
}

export async function getCheckout(id: string): Promise<CheckoutOut> {
  return get<CheckoutOut>(`${CHECKOUTS_ENDPOINT}/${encodeURIComponent(id)}`);
}

export async function updateCheckout(id: string, payload: CheckoutUpdate): Promise<CheckoutOut> {
  return httpPatch<CheckoutOut>(`${CHECKOUTS_ENDPOINT}/${encodeURIComponent(id)}`, { json: payload });
}

export async function deleteCheckout(id: string): Promise<void> {
  await del<void>(`${CHECKOUTS_ENDPOINT}/${encodeURIComponent(id)}`);
}
