import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllFolders, addFolder, updateFolder, deleteFolder } from '@/lib/db';
import type { Folder } from '@/types/pdf';

export function useFolders() {
  return useQuery({ queryKey: ['folders'], queryFn: getAllFolders });
}

export function useAddFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addFolder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateFolder,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
