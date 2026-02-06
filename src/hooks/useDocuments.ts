import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllDocuments, getDocument, addDocument, updateDocument, deleteDocument } from '@/lib/db';
import type { PDFDocument } from '@/types/pdf';

export function useDocuments() {
  return useQuery({ queryKey: ['documents'], queryFn: getAllDocuments });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => getDocument(id),
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
