import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllTags, addTag, deleteTag } from '@/lib/db';
import type { Tag } from '@/types/pdf';

export function useTags() {
  return useQuery({ queryKey: ['tags'], queryFn: getAllTags });
}

export function useAddTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addTag,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export type { Tag };
