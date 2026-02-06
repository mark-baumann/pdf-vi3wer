import { useState, useMemo, useRef, useCallback } from 'react';
import { Header } from '@/components/app/Header';
import { AppSidebar } from '@/components/app/AppSidebar';
import { DocumentGrid } from '@/components/app/DocumentGrid';
import { UploadZone } from '@/components/app/UploadZone';
import { useDocuments, useAddDocument } from '@/hooks/useDocuments';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import type { PDFDocument, ViewMode, SortOption } from '@/types/pdf';

export default function Index() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
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
    if (selectedTagId) docs = docs.filter(d => d.tagIds.includes(selectedTagId));
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
  }, [documents, selectedFolderId, selectedTagId, searchQuery, sortBy]);

  const handleUpload = useCallback(() => fileInputRef.current?.click(), []);

  const processFiles = useCallback(async (files: FileList) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) { toast.error('Nur PDF-Dateien werden unterstützt.'); return; }
    for (const file of pdfFiles) {
      const data = await file.arrayBuffer();
      const doc: PDFDocument = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.pdf$/i, ''),
        size: file.size, data,
        folderId: selectedFolderId,
        tagIds: [],
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
        bookmarks: [],
      };
      await addDoc.mutateAsync(doc);
    }
    toast.success(`${pdfFiles.length} Dokument${pdfFiles.length > 1 ? 'e' : ''} hochgeladen.`);
  }, [addDoc, selectedFolderId]);

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const sidebarContent = (
    <AppSidebar
      selectedFolderId={selectedFolderId}
      selectedTagId={selectedTagId}
      onFolderSelect={id => { setSelectedFolderId(id); setSidebarOpen(false); }}
      onTagSelect={id => { setSelectedTagId(id); setSidebarOpen(false); }}
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
