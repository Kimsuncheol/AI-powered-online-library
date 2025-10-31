'use client';

import type { NewBook, BookOut } from '@/app/interfaces/book';
import { getStoredAccessToken, handleResponse, resolveUrl } from '@/app/lib/api/auth';

export type BookCreate = NewBook;
export type BookUpdate = Partial<BookCreate>;

const BOOKS_ENDPOINT = '/books';

function buildAuthHeaders(): Record<string, string> {
  const token = getStoredAccessToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function buildJsonHeaders(includeAuth = false): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    Object.assign(headers, buildAuthHeaders());
  }

  return headers;
}

export async function createBook(payload: BookCreate): Promise<BookOut> {
  const response = await fetch(resolveUrl(`${BOOKS_ENDPOINT}/`), {
    method: 'POST',
    headers: buildJsonHeaders(true),
    body: JSON.stringify(payload),
  });

  return handleResponse<BookOut>(response);
}

export async function listBooks(skip?: number, limit?: number, search?: string): Promise<BookOut[]> {
  const params = new URLSearchParams();
  if (typeof skip === 'number') params.set('skip', String(skip));
  if (typeof limit === 'number') params.set('limit', String(limit));
  if (typeof search === 'string' && search.trim().length > 0) params.set('search', search.trim());

  const query = params.toString();
  const response = await fetch(resolveUrl(`${BOOKS_ENDPOINT}/${query ? `?${query}` : ''}`));

  return handleResponse<BookOut[]>(response);
}

export async function getBook(bookId: string): Promise<BookOut> {
  const response = await fetch(resolveUrl(`${BOOKS_ENDPOINT}/${encodeURIComponent(bookId)}`));
  return handleResponse<BookOut>(response);
}

export async function updateBook(bookId: string, payload: BookUpdate): Promise<BookOut> {
  const response = await fetch(resolveUrl(`${BOOKS_ENDPOINT}/${encodeURIComponent(bookId)}`), {
    method: 'PATCH',
    headers: buildJsonHeaders(true),
    body: JSON.stringify(payload),
  });

  return handleResponse<BookOut>(response);
}

export async function deleteBook(bookId: string): Promise<void> {
  const response = await fetch(resolveUrl(`${BOOKS_ENDPOINT}/${encodeURIComponent(bookId)}`), {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });

  await handleResponse<void>(response);
}
