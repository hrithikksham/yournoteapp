// src/types/journal.ts

// Corresponds to your JournalEntryOut Pydantic model
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  entry_date: string; // ISO string format
  is_locked: boolean;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

// Corresponds to your JournalEntryCreate model
export interface JournalEntryCreate {
  title: string;
  content: string;
  entry_date: string; // ISO string format
  is_locked: boolean;
  image_urls?: string[];
}

// Corresponds to your JournalEntryUpdate model
export interface JournalEntryUpdate {
  title?: string;
  content?: string;
  is_locked?: boolean;
  image_urls?: string[];
}

// For the grouped response
export type GroupedJournals = {
  [month: string]: {
    [day: string]: JournalEntry[];
  };
};

// For the image upload response
export interface ImageUploadResponse {
    path: string;
}