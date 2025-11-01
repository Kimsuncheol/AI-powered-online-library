'use client';

export interface AISearchQuery {
  q: string;
  topK?: number;
  rerank?: boolean;
  includeAnswer?: boolean;
  filters?: Record<string, unknown>;
}

export interface AISearchResultItem {
  id: string;
  title: string;
  snippet: string;
  score?: number;
  url?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface AISearchAnswerChunk {
  text: string;
  citations?: Array<{ title?: string; url?: string; id?: string }>;
}

export interface AISearchResponse {
  queryId?: string;
  query: string;
  results: AISearchResultItem[];
  answer?: AISearchAnswerChunk;
  tookMs?: number;
}

export interface SavedSearchOut {
  id: string;
  memberId?: string;
  query: string;
  createdAt: string;
  updatedAt?: string;
}
