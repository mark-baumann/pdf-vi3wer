import { useState } from 'react';
import { FileText, FolderOpen, FolderPlus, Tag, Trash2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useFolders, useAddFolder, useDeleteFolder, useRenameFolder } from '@/hooks/useFolders';
import { useTags, useAddTag, useDeleteTag } from '@/hooks/useTags';
import { FolderDialog } from './FolderDialog';
import { TagCreateDialog } from './TagManager';
import type { Folder, Tag as TagType } from '@/types/pdf';

interface SidebarProps {
  selectedFolderId: string | null;
  selectedTagId: string | null;
  onFolderSelect: (id: string | null) => void;
  onTagSelect: (id: string | null) => void;
  className?: string;
}

export function AppSidebar({ selectedFolderId, selectedTagId, onFolderSelect, onTagSelect, className }: SidebarProps) {
  const { data: folders = [] } = useFolders();
  const { data: tags = [] } = useTags();
  const addFolder = useAddFolder();
  const deleteFolder = useDeleteFolder();
  const renameFolder = useRenameFolder();
  const addTag = useAddTag();
  const deleteTag = useDeleteTag();

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  const handleCreateFolder = (name: string) => {
    addFolder.mutate({ id: crypto.randomUUID(), name, createdAt: Date.now() });
  };

  const handleRenameFolder = (name: string) => {
    if (editingFolder) {
      renameFolder.mutate({ ...editingFolder, name });
      setEditingFolder(null);
    }
  };

  const handleCreateTag = (name: string, color: string) => {
    addTag.mutate({ id: crypto.randomUUID(), name, color });
  };

  return (
    <aside className={cn('w-60 border-r border-border bg-card flex flex-col', className)}>
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground tracking-tight">📄 PDF Manager</h1>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          <button
            onClick={() => { onFolderSelect(null); onTagSelect(null); }}
            className={cn(
              'flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
              !selectedFolderId && !selectedTagId && 'bg-accent font-medium'
            )}
          >
            <FileText className="h-4 w-4" /> Alle Dokumente
          </button>

          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Ordner</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFolderDialogOpen(true)}>
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {folders.map(f => (
              <div key={f.id} className="group flex items-center">
                <button
                  onClick={() => { onFolderSelect(f.id); onTagSelect(null); }}
                  className={cn(
                    'flex items-center gap-2 flex-1 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent',
                    selectedFolderId === f.id && 'bg-accent font-medium'
                  )}
                >
                  <FolderOpen className="h-4 w-4 text-primary" /> {f.name}
                </button>
                <div className="hidden group-hover:flex gap-0.5 pr-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingFolder(f); setFolderDialogOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { deleteFolder.mutate(f.id); if (selectedFolderId === f.id) onFolderSelect(null); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Tags</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTagDialogOpen(true)}>
                <Tag className="h-3.5 w-3.5" />
              </Button>
            </div>
            {tags.map(t => (
              <div key={t.id} className="group flex items-center">
                <button
                  onClick={() => { onTagSelect(t.id); onFolderSelect(null); }}
                  className={cn(
                    'flex items-center gap-2 flex-1 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent',
                    selectedTagId === t.id && 'bg-accent font-medium'
                  )}
                >
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  {t.name}
                </button>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 hidden group-hover:flex"
                  onClick={() => { deleteTag.mutate(t.id); if (selectedTagId === t.id) onTagSelect(null); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </nav>
      </ScrollArea>

      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={open => { setFolderDialogOpen(open); if (!open) setEditingFolder(null); }}
        onSubmit={editingFolder ? handleRenameFolder : handleCreateFolder}
        initialName={editingFolder?.name}
        title={editingFolder ? 'Ordner umbenennen' : 'Neuer Ordner'}
      />

      <TagCreateDialog
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        onSubmit={handleCreateTag}
      />
    </aside>
  );
}
