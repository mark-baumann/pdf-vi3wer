import { put } from '@vercel/blob';

export async function uploadPdfToBlob(file: File, documentId: string) {
  const token = import.meta.env.BLOB_READ_WRITE_TOKEN ?? import.meta.env.VITE_BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error('Vercel Blob Token fehlt (BLOB_READ_WRITE_TOKEN)');
  }

  const sanitizedName = file.name.replace(/\s+/g, '-');
  const pathname = `pdfs/${documentId}-${Date.now()}-${sanitizedName}`;

  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: false,
    token,
  });

  return blob.url;
}
