import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocument, useUpdateDocument } from '@/hooks/useDocuments';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/app/ThemeToggle';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PageBookmark } from '@/types/pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: doc, isLoading } = useDocument(id!);
  const updateDoc = useUpdateDocument();
  const isMobile = useIsMobile();

  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [bookmarkPage, setBookmarkPage] = useState('1');
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef(new Map<number, HTMLDivElement>());

  const blobUrl = useMemo(() => {
    if (!doc?.data) return null;
    const blob = new Blob([doc.data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }, [doc?.data]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    if (!viewerRef.current) return;
    const updateWidth = () => {
      if (!viewerRef.current) return;
      setPageWidth(Math.min(viewerRef.current.clientWidth - 32, 960));
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(viewerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!currentPage) return;
    const target = pageRefs.current.get(currentPage);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);

  const addBookmark = useCallback(() => {
    if (!doc) return;
    const page = parseInt(bookmarkPage);
    if (isNaN(page) || page < 1) return;
    const bookmark: PageBookmark = {
      page,
      label: bookmarkLabel.trim() || `Seite ${page}`,
      createdAt: Date.now(),
    };
    updateDoc.mutate({ ...doc, bookmarks: [...doc.bookmarks, bookmark] });
    setBookmarkDialogOpen(false);
    setBookmarkPage('1');
    setBookmarkLabel('');
  }, [doc, bookmarkPage, bookmarkLabel, updateDoc]);

  const removeBookmark = useCallback((index: number) => {
    if (!doc) return;
    const bookmarks = doc.bookmarks.filter((_, i) => i !== index);
    updateDoc.mutate({ ...doc, bookmarks });
  }, [doc, updateDoc]);

  const goToBookmark = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDocumentLoad = useCallback(({ numPages: totalPages }: { numPages: number }) => {
    setNumPages(totalPages);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Laden…</div>;
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-muted-foreground">
        <p>Dokument nicht gefunden.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>Zurück</Button>
      </div>
    );
  }

  const bookmarkPanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="font-semibold text-sm">Lesezeichen</span>
        <Button size="sm" variant="ghost" className="gap-1" onClick={() => setBookmarkDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Hinzufügen
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {doc.bookmarks.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">Noch keine Lesezeichen.</p>
          )}
          {doc.bookmarks
            .sort((a, b) => a.page - b.page)
            .map((bm, i) => (
              <div key={i} className="flex items-center gap-2 group">
                <button
                  onClick={() => goToBookmark(bm.page)}
                  className="flex items-center gap-2 flex-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <BookmarkCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate flex-1">{bm.label}</span>
                  <span className="text-xs text-muted-foreground">S. {bm.page}</span>
                </button>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => removeBookmark(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Toolbar */}
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-medium text-sm truncate flex-1">{doc.name}</h2>
        <ThemeToggle />
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bookmark className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-72">
              {bookmarkPanel}
            </SheetContent>
          </Sheet>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setBookmarkDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </header>

      <div className="flex flex-1 min-h-0">
        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto" ref={viewerRef}>
          {blobUrl && (
            <div className="flex justify-center px-4 py-6">
              <Document
                file={blobUrl}
                onLoadSuccess={handleDocumentLoad}
                loading={<div className="text-muted-foreground">PDF wird geladen…</div>}
                error={<div className="text-destructive">PDF konnte nicht angezeigt werden.</div>}
              >
                <div className="flex flex-col gap-6">
                  {Array.from(new Array(numPages), (_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <div
                        key={`page_${pageNumber}`}
                        ref={(node) => {
                          if (node) {
                            pageRefs.current.set(pageNumber, node);
                          } else {
                            pageRefs.current.delete(pageNumber);
                          }
                        }}
                        className="flex justify-center"
                      >
                        <Page
                          pageNumber={pageNumber}
                          width={pageWidth ?? undefined}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                          renderMode="svg"
                        />
                      </div>
                    );
                  })}
                </div>
              </Document>
            </div>
          )}
        </div>

        {/* Bookmark panel - desktop */}
        {!isMobile && (
          <aside className="w-64 border-l border-border">
            {bookmarkPanel}
          </aside>
        )}
      </div>

      {/* Add bookmark dialog */}
      <Dialog open={bookmarkDialogOpen} onOpenChange={setBookmarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lesezeichen hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Seitennummer</label>
              <Input
                type="number"
                min={1}
                value={bookmarkPage}
                onChange={e => setBookmarkPage(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bezeichnung (optional)</label>
              <Input
                value={bookmarkLabel}
                onChange={e => setBookmarkLabel(e.target.value)}
                placeholder={`Seite ${bookmarkPage}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addBookmark}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
