'use client';

import { del, get, post } from '@/app/lib/http';
import type { AISearchQuery, AISearchResponse, SavedSearchOut } from '@/app/types/ai-search';

const AI_SEARCH_BASE = '/ai-search';

export async function executeAISearch(payload: AISearchQuery): Promise<AISearchResponse> {
  return post<AISearchResponse>(`${AI_SEARCH_BASE}/query`, { json: payload });
}

export interface ListAISearchRecordsParams {
  skip?: number;
  limit?: number;
}

export async function listAISearchRecords(params: ListAISearchRecordsParams = {}): Promise<SavedSearchOut[]> {
  const searchParams = new URLSearchParams();
  if (typeof params.skip === 'number' && params.skip >= 0) {
    searchParams.set('skip', String(Math.floor(params.skip)));
  }
  if (typeof params.limit === 'number' && params.limit >= 1) {
    searchParams.set('limit', String(Math.floor(params.limit)));
  }

  const query = searchParams.toString();
  const url = `${AI_SEARCH_BASE}/records${query ? `?${query}` : ''}`;

  return get<SavedSearchOut[]>(url);
}

export async function getAISearchRecord(recordId: string): Promise<AISearchResponse> {
  const encodedId = encodeURIComponent(recordId);
  return get<AISearchResponse>(`${AI_SEARCH_BASE}/records/${encodedId}`);
}

export async function deleteAISearchRecord(recordId: string): Promise<void> {
  const encodedId = encodeURIComponent(recordId);
  await del<void>(`${AI_SEARCH_BASE}/records/${encodedId}`);
}
