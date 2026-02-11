import type { PDFDocument } from '@/types/pdf';

type BlobListItem = {
  pathname: string;
  size: number;
  uploadedAt: string;
  url: string;
};

function blobPathToId(pathname: string) {
  return `blob-${encodeURIComponent(pathname)}`;
}

function prettifyFilename(rawFilename: string) {
  return rawFilename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

function blobToDocument(blob: BlobListItem): PDFDocument {
  const filename = blob.pathname.split('/').pop() || 'Unbenannt';
  const match = filename.match(/-(\d{13})-(.+)$/);
  const readableName = prettifyFilename(match?.[2] || filename);

  return {
    id: blobPathToId(blob.pathname),
    name: readableName,
    size: blob.size,
    folderId: null,
    createdAt: Date.parse(blob.uploadedAt) || Date.now(),
    lastOpenedAt: Date.parse(blob.uploadedAt) || Date.now(),
    blobUrl: blob.url,
    isSyncedToBlob: true,
    bookmarks: [],
  };
}

export async function uploadPdfToBlob(file: File, documentId: string) {
  const sanitizedName = file.name.replace(/\s+/g, '-');
  const pathname = `pdfs/${documentId}-${Date.now()}-${sanitizedName}`;

  const response = await fetch(`/api/blob/upload?filename=${encodeURIComponent(pathname)}`, {
    method: 'POST',
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Blob upload failed with status ${response.status}`);
  }

  const blob = await response.json() as { url: string };
  return blob.url;
}

export async function getBlobDocuments() {
  const response = await fetch('/api/blob/list');

  if (!response.ok) {
    throw new Error(`Blob list failed with status ${response.status}`);
  }

  const { blobs } = await response.json() as { blobs: BlobListItem[] };
  return blobs.map(blobToDocument);
}
