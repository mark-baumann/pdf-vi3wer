import { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocument } from '@/hooks/useDocuments';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;

export default function ViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: doc, isLoading } = useDocument(id!);
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef(new Map<number, HTMLDivElement>());


  const pdfFile = useMemo(() => {
    if (doc?.blobUrl) return doc.blobUrl;
    if (!doc?.data) return null;
    // react-pdf/pdf.js may transfer the passed ArrayBuffer to a worker.
    // Clone the buffer so cached IndexedDB/query data stays reusable when revisiting a document.
    return { data: new Uint8Array(doc.data.slice(0)) };
  }, [doc?.blobUrl, doc?.data]);

  useEffect(() => {
    setNumPages(0);
    pageRefs.current.clear();
  }, [id]);

  useLayoutEffect(() => {
    if (!viewerRef.current) return;

    const updateWidth = () => {
      if (!viewerRef.current) return;
      const containerWidth = viewerRef.current.clientWidth;
      if (!containerWidth) return;
      setPageWidth(Math.min(containerWidth - 32, 960));
    };

    updateWidth();
    requestAnimationFrame(updateWidth);

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(viewerRef.current);

    window.addEventListener('orientationchange', updateWidth);
    window.visualViewport?.addEventListener('resize', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', updateWidth);
      window.visualViewport?.removeEventListener('resize', updateWidth);
    };
  }, []);


  const handleDocumentLoad = useCallback(({ numPages: totalPages }: { numPages: number }) => {
    setNumPages(totalPages);
    requestAnimationFrame(() => {
      if (!viewerRef.current) return;
      setPageWidth(Math.min(viewerRef.current.clientWidth - 32, 960));
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => Math.max(MIN_ZOOM, Number((current - ZOOM_STEP).toFixed(2))));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((current) => Math.min(MAX_ZOOM, Number((current + ZOOM_STEP).toFixed(2))));
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

  if (!pdfFile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-muted-foreground">
        <p>PDF-Datei nicht verfügbar.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>Zurück</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Toolbar */}
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-medium text-sm truncate flex-1">{doc.name}</h2>
        <div className="flex items-center gap-1 rounded-md border border-border px-1 py-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Rauszoomen"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-12 text-center text-xs font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Reinzoomen"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-auto" ref={viewerRef}>
          {pdfFile && (
            <div className="flex justify-center px-4 py-6">
              <Document
                key={id}
                file={pdfFile}
                onLoadSuccess={handleDocumentLoad}
                loading={<div className="text-muted-foreground">PDF wird geladen…</div>}
                error={<div className="text-destructive">PDF konnte nicht geladen werden.</div>}
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
                          width={pageWidth ? Math.round(pageWidth * zoom) : undefined}
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
      </div>
    </div>
  );
}
