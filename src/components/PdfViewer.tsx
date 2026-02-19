import { useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  FileText,
  Loader2,
} from "lucide-react";

// Set up the worker for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  file: File;
  onClose: () => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.25;

export const PdfViewer = ({ file, onClose }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [pageInputValue, setPageInputValue] = useState("1");
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  }, []);

  const goToPrevPage = () => {
    const next = Math.max(1, currentPage - 1);
    setCurrentPage(next);
    setPageInputValue(String(next));
  };

  const goToNextPage = () => {
    const next = Math.min(numPages, currentPage + 1);
    setCurrentPage(next);
    setPageInputValue(String(next));
  };

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
  const resetZoom = () => setScale(1.0);

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const parsed = parseInt(pageInputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      setCurrentPage(parsed);
    } else {
      setPageInputValue(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handlePageInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  // Determine a good page width based on screen
  const getPageWidth = () => {
    if (typeof window === "undefined") return 600;
    const vw = window.innerWidth;
    if (vw < 640) return vw - 32; // mobile: full width minus padding
    if (vw < 1024) return Math.min(600, vw - 64);
    return Math.min(750, vw - 120);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Toolbar */}
      <header
        className="flex items-center gap-2 px-3 py-2 shrink-0 z-10 shadow-md"
        style={{ backgroundColor: "hsl(var(--toolbar))" }}
      >
        {/* File name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="w-4 h-4 text-white/70 shrink-0" />
          <span className="text-sm text-white/90 font-medium truncate">{file.name}</span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            className="toolbar-btn"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            aria-label="Vorherige Seite"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1 text-white/90 text-sm select-none">
            <input
              type="text"
              inputMode="numeric"
              value={pageInputValue}
              onChange={handlePageInput}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="w-10 text-center bg-white/10 border border-white/20 rounded-md py-0.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/40"
              aria-label="Seite"
            />
            <span className="text-white/60">/ {numPages}</span>
          </div>

          <button
            className="toolbar-btn"
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            aria-label="Nächste Seite"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button className="toolbar-btn" onClick={zoomOut} disabled={scale <= MIN_SCALE} aria-label="Verkleinern">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            className="text-xs text-white/80 min-w-[44px] text-center hover:text-white transition-colors"
            onClick={resetZoom}
            aria-label="Zoom zurücksetzen"
          >
            {Math.round(scale * 100)}%
          </button>
          <button className="toolbar-btn" onClick={zoomIn} disabled={scale >= MAX_SCALE} aria-label="Vergrößern">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Close */}
        <button className="toolbar-btn" onClick={onClose} aria-label="Schließen">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* PDF Canvas Area */}
      <main
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{ backgroundColor: "hsl(var(--viewer-bg))" }}
      >
        <div className="flex justify-center items-start py-6 px-4 min-h-full">
          {isLoading && (
            <div className="flex flex-col items-center justify-center mt-24 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Wird geladen…</p>
            </div>
          )}

          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading=""
            error={
              <div className="flex flex-col items-center justify-center mt-24 gap-2 text-destructive">
                <p className="font-medium">PDF konnte nicht geladen werden</p>
                <p className="text-sm text-muted-foreground">Bitte versuche eine andere Datei.</p>
              </div>
            }
          >
            <div className="page-shadow rounded-sm overflow-hidden bg-card">
              <Page
                pageNumber={currentPage}
                scale={scale}
                width={getPageWidth()}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading=""
              />
            </div>
          </Document>
        </div>
      </main>

      {/* Bottom bar on mobile for page nav */}
      <nav
        className="sm:hidden flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0"
      >
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Zurück
        </button>
        <span className="text-sm text-muted-foreground">
          {currentPage} / {numPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="flex items-center gap-1 text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
        >
          Weiter
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};
