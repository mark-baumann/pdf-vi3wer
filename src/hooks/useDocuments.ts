import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import { getBlobDocuments } from '@/lib/blob';
import type { PDFDocument } from '@/types/pdf';

function getDocumentIdCandidates(routeId: string) {
  const candidates = new Set([routeId]);

  if (routeId.startsWith('blob-')) {
    const blobPath = routeId.slice('blob-'.length);
    candidates.add(`blob-${encodeURIComponent(blobPath)}`);

    try {
      candidates.add(`blob-${encodeURIComponent(decodeURIComponent(blobPath))}`);
    } catch {
      // Ignore malformed encodings and keep available candidates.
    }
  }

  return [...candidates];
}

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
      const idCandidates = getDocumentIdCandidates(id);

      for (const candidateId of idCandidates) {
        const localDocument = await getDocument(candidateId);
        if (localDocument) {
          return localDocument;
        }
      }

      const blobDocuments = await getBlobDocuments().catch(() => []);
      return blobDocuments.find((doc) => idCandidates.includes(doc.id)) ?? null;
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
