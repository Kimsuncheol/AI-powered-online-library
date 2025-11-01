'use client';

import type { CheckoutCreate, CheckoutOut, CheckoutUpdate } from '@/app/types/checkouts';
import { clearStoredTokens, getStoredAccessToken } from '@/app/lib/api/auth';
import { del, get, HttpError, patch as httpPatch, post } from '@/app/lib/http';

const ADMIN_LOANS_ENDPOINT = '/admin/loans';

type ListParams = {
  skip?: number;
  limit?: number;
  search?: string | null;
  status?: string | null;
  memberId?: string | null;
  bookId?: string | null;
  from?: string | null;
  to?: string | null;
};

function buildQuery(params?: ListParams): string {
  if (!params) {
    return '';
  }

  const query = new URLSearchParams();
  const { skip, limit, search, status, memberId, bookId, from, to } = params;

  if (typeof skip === 'number' && skip > 0) {
    query.set('skip', String(skip));
  }
  if (typeof limit === 'number' && limit > 0) {
    query.set('limit', String(limit));
  }
  if (typeof search === 'string' && search.trim().length > 0) {
    query.set('search', search.trim());
  }
  if (typeof status === 'string' && status.trim().length > 0) {
    query.set('status', status.trim());
  }
  if (typeof memberId === 'string' && memberId.trim().length > 0) {
    query.set('memberId', memberId.trim());
  }
  if (typeof bookId === 'string' && bookId.trim().length > 0) {
    query.set('bookId', bookId.trim());
  }
  if (typeof from === 'string' && from.trim().length > 0) {
    query.set('from', from.trim());
  }
  if (typeof to === 'string' && to.trim().length > 0) {
    query.set('to', to.trim());
  }

  const queryString = query.toString();
  return queryString.length > 0 ? `?${queryString}` : '';
}

function buildAuthHeaders(): Headers {
  const headers = new Headers();
  const token = getStoredAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function handleAuthError(error: unknown): void {
  if (error instanceof HttpError && (error.status === 401 || error.status === 403 || error.status === 419)) {
    clearStoredTokens();
  }
}

async function requestWithAuth<T>(factory: () => Promise<T>): Promise<T> {
  try {
    return await factory();
  } catch (error) {
    handleAuthError(error);
    throw error;
  }
}

export async function listAdminLoans(params?: ListParams): Promise<CheckoutOut[]> {
  const query = buildQuery(params);
  const url = `${ADMIN_LOANS_ENDPOINT}${query}`;

  return requestWithAuth(async () => {
    let totalHeaderValue: number | undefined;
    const items = await get<CheckoutOut[]>(url, {
      headers: buildAuthHeaders(),
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
  });
}

export async function createAdminLoan(payload: CheckoutCreate): Promise<CheckoutOut> {
  return requestWithAuth(() =>
    post<CheckoutOut>(`${ADMIN_LOANS_ENDPOINT}/`, {
      headers: buildAuthHeaders(),
      json: payload,
    }),
  );
}

export async function getAdminLoan(checkoutId: string): Promise<CheckoutOut> {
  const encoded = encodeURIComponent(checkoutId);
  return requestWithAuth(() =>
    get<CheckoutOut>(`${ADMIN_LOANS_ENDPOINT}/${encoded}`, {
      headers: buildAuthHeaders(),
    }),
  );
}

export async function updateAdminLoan(checkoutId: string, payload: CheckoutUpdate): Promise<CheckoutOut> {
  const encoded = encodeURIComponent(checkoutId);
  return requestWithAuth(() =>
    httpPatch<CheckoutOut>(`${ADMIN_LOANS_ENDPOINT}/${encoded}`, {
      headers: buildAuthHeaders(),
      json: payload,
    }),
  );
}

export async function deleteAdminLoan(checkoutId: string): Promise<void> {
  const encoded = encodeURIComponent(checkoutId);
  await requestWithAuth(() =>
    del<void>(`${ADMIN_LOANS_ENDPOINT}/${encoded}`, {
      headers: buildAuthHeaders(),
    }),
  );
}
