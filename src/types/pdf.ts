export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  folderId: string | null;
  tagIds: string[];
  createdAt: number;
  lastOpenedAt: number;
  bookmarks: PageBookmark[];
}

export interface PageBookmark {
  page: number;
  label: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'name' | 'date' | 'lastOpened';

export const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];
