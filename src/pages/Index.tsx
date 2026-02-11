import { useState, useMemo, useRef, useCallback } from 'react';
import { Header } from '@/components/app/Header';
import { AppSidebar } from '@/components/app/AppSidebar';
import { DocumentGrid } from '@/components/app/DocumentGrid';
import { useDocuments, useAddDocument } from '@/hooks/useDocuments';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { uploadPdfToBlob } from '@/lib/blob';
import type { PDFDocument, ViewMode, SortOption } from '@/types/pdf';

export default function Index() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: documents = [] } = useDocuments();
  const addDoc = useAddDocument();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = useMemo(() => {
    let docs = [...documents];
    if (selectedFolderId) docs = docs.filter(d => d.folderId === selectedFolderId);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => d.name.toLowerCase().includes(q));
    }
    docs.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'lastOpened') return b.lastOpenedAt - a.lastOpenedAt;
      return b.createdAt - a.createdAt;
    });
    return docs;
  }, [documents, selectedFolderId, searchQuery, sortBy]);

  const handleUpload = useCallback(() => fileInputRef.current?.click(), []);

  const processFiles = useCallback(async (files: FileList) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) { toast.error('Nur PDF-Dateien werden unterstützt.'); return; }
    let successfulUploads = 0;
    let localFallbackUploads = 0;

    for (const file of pdfFiles) {
      const id = crypto.randomUUID();
      const baseDoc: Omit<PDFDocument, 'bookmarks'> = {
        id,
        name: file.name.replace(/\.pdf$/i, ''),
        size: file.size,
        folderId: selectedFolderId,
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
      };

      try {
        const blobUrl = await uploadPdfToBlob(file, id);
        await addDoc.mutateAsync({
          ...baseDoc,
          blobUrl,
          isSyncedToBlob: true,
          bookmarks: [],
        });
        successfulUploads += 1;
      } catch (error) {
        console.error('Blob upload failed, fallback to local storage:', error);
        try {
          const data = await file.arrayBuffer();
          await addDoc.mutateAsync({
            ...baseDoc,
            data,
            isSyncedToBlob: false,
            bookmarks: [],
          });
          localFallbackUploads += 1;
          successfulUploads += 1;
        } catch (fallbackError) {
          console.error('Local document storage failed:', fallbackError);
          toast.error(`Upload fehlgeschlagen: ${file.name}`);
        }
      }
    }

    if (successfulUploads > 0) {
      toast.success(`${successfulUploads} Dokument${successfulUploads > 1 ? 'e' : ''} hochgeladen.`);
    }

    if (localFallbackUploads > 0) {
      toast.warning(`${localFallbackUploads} Dokument${localFallbackUploads > 1 ? 'e wurden' : ' wurde'} lokal gespeichert (ohne Vercel Blob).`);
    }
  }, [addDoc, selectedFolderId]);

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const sidebarContent = (
    <AppSidebar
      selectedFolderId={selectedFolderId}
      onFolderSelect={id => { setSelectedFolderId(id); setSidebarOpen(false); }}
    />
  );

  return (
    <div className="flex h-screen bg-background" onDragOver={handleDragOver} onDrop={handleDrop}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = ''; }}
      />

      {/* Desktop sidebar */}
      {!isMobile && sidebarContent}

      {/* Mobile sidebar sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onUpload={handleUpload}
          onMenuToggle={() => setSidebarOpen(true)}
          showMenu={isMobile}
        />
        <div className="flex-1 overflow-auto p-4">
          <DocumentGrid documents={filteredDocs} viewMode={viewMode} />
        </div>
      </main>
    </div>
  );
}
