import { useNavigate } from 'react-router-dom';
import { FileText, MoreVertical, FolderInput, Trash2, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useFolders } from '@/hooks/useFolders';
import { useUpdateDocument, useDeleteDocument } from '@/hooks/useDocuments';
import type { PDFDocument, ViewMode } from '@/types/pdf';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface Props {
  documents: PDFDocument[];
  viewMode: ViewMode;
}

export function DocumentGrid({ documents, viewMode }: Props) {
  const navigate = useNavigate();
  const { data: folders = [] } = useFolders();
  const updateDoc = useUpdateDocument();
  const deleteDoc = useDeleteDocument();

  const openDoc = (doc: PDFDocument) => {
    updateDoc.mutate({ ...doc, lastOpenedAt: Date.now() });
    navigate(`/view/${doc.id}`);
  };

  const moveToFolder = (doc: PDFDocument, folderId: string | null) => {
    updateDoc.mutate({ ...doc, folderId });
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FileText className="h-16 w-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">Keine Dokumente</p>
        <p className="text-sm mt-1">Lade PDFs hoch, um loszulegen.</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {documents.map(doc => (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/50 cursor-pointer transition-colors group"
            onClick={() => openDoc(doc)}
          >
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <span className="font-medium text-sm flex-1 truncate flex items-center gap-1.5">
              <span className="truncate">{doc.name}</span>
              {(doc.isSyncedToBlob || !!doc.blobUrl) && <Cloud className="h-3.5 w-3.5 text-sky-500 shrink-0" />}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">{formatSize(doc.size)}</span>
            <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(doc.createdAt)}</span>
            <DocMenu doc={doc} folders={folders} onMoveToFolder={moveToFolder} onDelete={() => deleteDoc.mutate(doc.id)} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {documents.map(doc => (
        <Card
          key={doc.id}
          className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
          onClick={() => openDoc(doc)}
        >
          <div className="aspect-[3/4] bg-muted/50 flex items-center justify-center relative">
            <FileText className="h-12 w-12 text-primary/30" />
            <div className="absolute top-1 right-1" onClick={e => e.stopPropagation()}>
              <DocMenu doc={doc} folders={folders} onMoveToFolder={moveToFolder} onDelete={() => deleteDoc.mutate(doc.id)} />
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-sm font-medium truncate flex items-center gap-1.5">
              <span className="truncate">{doc.name}</span>
              {(doc.isSyncedToBlob || !!doc.blobUrl) && <Cloud className="h-3.5 w-3.5 text-sky-500 shrink-0" />}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-muted-foreground ml-auto">{formatSize(doc.size)}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DocMenu({ doc, folders, onMoveToFolder, onDelete }: {
  doc: PDFDocument; folders: { id: string; name: string }[];
  onMoveToFolder: (doc: PDFDocument, folderId: string | null) => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
        {folders.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger><FolderInput className="h-4 w-4 mr-2" /> In Ordner</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onMoveToFolder(doc, null)}>
                — Kein Ordner —
              </DropdownMenuItem>
              {folders.map(f => (
                <DropdownMenuItem key={f.id} onClick={() => onMoveToFolder(doc, f.id)}>
                  {f.name} {doc.folderId === f.id && '✓'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" /> Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
