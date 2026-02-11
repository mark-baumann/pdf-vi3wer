import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { getBlobDocuments } from '@/lib/blob';
import type { PDFDocument } from '@/types/pdf';

async function getAllDocumentsWithBlobFallback() {
  const [localDocuments, blobDocuments] = await Promise.all([
    getAllDocuments(),
    getBlobDocuments().catch(() => []),
  ]);

  const localBlobUrls = new Set(localDocuments.map((doc) => doc.blobUrl).filter(Boolean));
  const missingBlobDocuments = blobDocuments.filter((doc) => doc.blobUrl && !localBlobUrls.has(doc.blobUrl));

  return [...localDocuments, ...missingBlobDocuments];
}

export function useDocuments() {
  return useQuery({ queryKey: ['documents'], queryFn: getAllDocumentsWithBlobFallback });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const localDocument = await getDocument(id);
      if (localDocument) {
        return localDocument;
      }

      const blobDocuments = await getBlobDocuments().catch(() => []);
      return blobDocuments.find((doc) => doc.id === id) ?? null;
    },
    enabled: !!id,
  });
}

export function useAddDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (_, doc) => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['documents', doc.id] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}
