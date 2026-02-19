import { useState, useEffect, useRef, useCallback } from "react";
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

// pdfjs v3 is loaded via CDN in index.html as window.pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PdfViewerProps {
  file: File;
  onClose: () => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.25;

export const PdfViewer = ({ file, onClose }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInputValue, setPageInputValue] = useState("1");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Load the PDF document once the file changes
  useEffect(() => {
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) {
      setError("PDF-Bibliothek konnte nicht geladen werden.");
      return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const url = URL.createObjectURL(file);
    setIsLoading(true);
    setError(null);
    setCurrentPage(1);
    setPageInputValue("1");

    const loadingTask = pdfjsLib.getDocument({ url });
    loadingTask.promise
      .then((pdf: any) => {
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setIsLoading(false);
      })
      .catch(() => {
        setError("PDF konnte nicht geladen werden.");
        setIsLoading(false);
      })
      .finally(() => {
        URL.revokeObjectURL(url);
      });

    return () => {
      loadingTask.destroy?.();
    };
  }, [file]);

  // Render the current page to canvas whenever page or scale changes
  useEffect(() => {
    const pdf = pdfDocRef.current;
    if (!pdf || isLoading || error) return;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    pdf.getPage(currentPage).then((page: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * dpr });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;

      renderTask.promise.catch((err: any) => {
        // Ignore cancellation errors
        if (err?.name !== "RenderingCancelledException") {
          console.error("Render error:", err);
        }
      });
    });
  }, [currentPage, scale, isLoading, error]);

  const navigate = useCallback(
    (delta: number) => {
      const next = Math.min(numPages, Math.max(1, currentPage + delta));
      setCurrentPage(next);
      setPageInputValue(String(next));
    },
    [currentPage, numPages]
  );

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
  const resetZoom = () => setScale(1.0);

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPageInputValue(e.target.value);

  const commitPageInput = () => {
    const parsed = parseInt(pageInputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      setCurrentPage(parsed);
    } else {
      setPageInputValue(String(currentPage));
    }
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
        {!isLoading && !error && (
          <div className="flex items-center gap-1">
            <button
              className="toolbar-btn"
              onClick={() => navigate(-1)}
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
                onBlur={commitPageInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitPageInput();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-10 text-center bg-white/10 border border-white/20 rounded-md py-0.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/40"
                aria-label="Seite"
              />
              <span className="text-white/60">/ {numPages}</span>
            </div>
            <button
              className="toolbar-btn"
              onClick={() => navigate(1)}
              disabled={currentPage >= numPages}
              aria-label="Nächste Seite"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Zoom */}
        {!isLoading && !error && (
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
        )}

        {/* Close */}
        <button className="toolbar-btn" onClick={onClose} aria-label="Schließen">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Canvas Area */}
      <main
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

          {error && (
            <div className="flex flex-col items-center justify-center mt-24 gap-2 text-destructive">
              <p className="font-medium">{error}</p>
              <p className="text-sm text-muted-foreground">Bitte versuche eine andere Datei.</p>
            </div>
          )}

          {!error && (
            <div className="page-shadow rounded-sm overflow-hidden bg-card">
              <canvas ref={canvasRef} />
            </div>
          )}
        </div>
      </main>

      {/* Mobile bottom bar */}
      {!isLoading && !error && (
        <nav className="sm:hidden flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0">
          <button
            onClick={() => navigate(-1)}
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
            onClick={() => navigate(1)}
            disabled={currentPage >= numPages}
            className="flex items-center gap-1 text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            Weiter
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
