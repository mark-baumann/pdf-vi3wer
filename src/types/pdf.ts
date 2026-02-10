export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  data?: ArrayBuffer;
  blobUrl?: string | null;
  isSyncedToBlob?: boolean;
  folderId: string | null;
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

export type ViewMode = 'grid' | 'list';
export type SortOption = 'name' | 'date' | 'lastOpened';
