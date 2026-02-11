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
