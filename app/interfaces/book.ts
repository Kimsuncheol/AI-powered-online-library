// types/books.ts
export interface NewBook {
    title: string;                 // required
    author: string;                // required
    category?: string;             // e.g., "Computer Science"
    publisher?: string;
    description?: string;          // long text
    coverImageUrl?: string;        // URL; (file upload optional, see FE prompt)
    isbn?: string;                 // ISBN-10 or ISBN-13
    language?: string;             // e.g., "en", "ko"
    pageCount?: number;            // positive integer
    publishedAt?: string;          // ISO date (YYYY-MM-DD or full ISO)
    tags?: string[];               // simple keyword list
  }
  
  export interface BookOut {
    id: string;
    title: string;
    author: string;
    category?: string;
    publisher?: string;
    description?: string;
    coverImageUrl?: string;
    isbn?: string;
    language?: string;
    pageCount?: number;
    publishedAt?: string;
    tags?: string[];
    aiSummary?: string;            // if backend computes/stores a summary later
    createdAt: string;
    updatedAt?: string;
  }