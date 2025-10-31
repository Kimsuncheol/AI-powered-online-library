'use client';

import type { NewBook, BookOut } from '@/app/interfaces/book';
import { del, get, patch as httpPatch, post } from '@/app/lib/http';

export type BookCreate = NewBook;
export type BookUpdate = Partial<BookCreate>;

const BOOKS_ENDPOINT = '/books';

export async function createBook(payload: BookCreate): Promise<BookOut> {
  return post<BookOut>(`${BOOKS_ENDPOINT}/`, { json: payload });
}

export async function listBooks(skip?: number, limit?: number, search?: string): Promise<BookOut[]> {
  const params = new URLSearchParams();
  if (typeof skip === 'number') params.set('skip', String(skip));
  if (typeof limit === 'number') params.set('limit', String(limit));
  if (typeof search === 'string' && search.trim().length > 0) params.set('search', search.trim());

  const query = params.toString();
  const url = `${BOOKS_ENDPOINT}/${query ? `?${query}` : ''}`;
  return get<BookOut[]>(url);
}

export async function getBook(bookId: string): Promise<BookOut> {
  return get<BookOut>(`${BOOKS_ENDPOINT}/${encodeURIComponent(bookId)}`);
}

export async function updateBook(bookId: string, payload: BookUpdate): Promise<BookOut> {
  return httpPatch<BookOut>(`${BOOKS_ENDPOINT}/${encodeURIComponent(bookId)}`, { json: payload });
}

export async function deleteBook(bookId: string): Promise<void> {
  await del<void>(`${BOOKS_ENDPOINT}/${encodeURIComponent(bookId)}`);
}
