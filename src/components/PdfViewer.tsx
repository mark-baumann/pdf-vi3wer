import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
  Loader2,
  Download,
} from "lucide-react";

interface PdfViewerProps {
  file: File;
  onClose: () => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.25;

// Render PDF pages to canvas via pdf.js (loaded globally from CDN)
declare global {
  interface Window { pdfjsLib: any; }
}

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
  const objectUrlRef = useRef<string | null>(null);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Wait for pdfjsLib if not yet available (CDN may still be loading)
      let attempts = 0;
      while (!window.pdfjsLib && attempts < 20) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if (!window.pdfjsLib) {
        setError("PDF-Bibliothek konnte nicht geladen werden.");
        setIsLoading(false);
        return;
      }

      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      // Revoke previous object URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;

      setIsLoading(true);
      setError(null);
      setCurrentPage(1);
      setPageInputValue("1");

      try {
        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setIsLoading(false);
      } catch (err: any) {
        if (cancelled) return;
        console.error("PDF load error:", err);
        setError("PDF konnte nicht geladen werden.");
        setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [file]);

  // Render current page to canvas
  useEffect(() => {
    const pdf = pdfDocRef.current;
    if (!pdf || isLoading || error) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    let cancelled = false;

    pdf.getPage(currentPage).then((page: any) => {
      if (cancelled) return;
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

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      task.promise.catch((e: any) => {
        if (e?.name !== "RenderingCancelledException") console.error(e);
      });
    });

    return () => { cancelled = true; };
  }, [currentPage, scale, isLoading, error]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const navigate = (delta: number) => {
    const next = Math.min(numPages, Math.max(1, currentPage + delta));
    setCurrentPage(next);
    setPageInputValue(String(next));
  };

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
  const resetZoom = () => setScale(1.0);

  const commitPageInput = () => {
    const parsed = parseInt(pageInputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      setCurrentPage(parsed);
    } else {
      setPageInputValue(String(currentPage));
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = objectUrlRef.current!;
    a.download = file.name;
    a.click();
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Toolbar */}
      <header
        className="flex items-center gap-2 px-3 py-2 shrink-0 z-10 shadow-md"
        style={{ backgroundColor: "hsl(var(--toolbar))" }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="w-4 h-4 text-white/70 shrink-0" />
          <span className="text-sm text-white/90 font-medium truncate">{file.name}</span>
        </div>

        {!isLoading && !error && (
          <>
            {/* Page nav */}
            <div className="flex items-center gap-1">
              <button className="toolbar-btn" onClick={() => navigate(-1)} disabled={currentPage <= 1} aria-label="Vorherige Seite">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1 text-white/90 text-sm select-none">
                <input
                  type="text"
                  inputMode="numeric"
                  value={pageInputValue}
                  onChange={(e) => setPageInputValue(e.target.value)}
                  onBlur={commitPageInput}
                  onKeyDown={(e) => { if (e.key === "Enter") { commitPageInput(); (e.target as HTMLInputElement).blur(); } }}
                  className="w-10 text-center bg-white/10 border border-white/20 rounded-md py-0.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/40"
                  aria-label="Seite"
                />
                <span className="text-white/60">/ {numPages}</span>
              </div>
              <button className="toolbar-btn" onClick={() => navigate(1)} disabled={currentPage >= numPages} aria-label="Nächste Seite">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <button className="toolbar-btn" onClick={zoomOut} disabled={scale <= MIN_SCALE} aria-label="Verkleinern">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button className="text-xs text-white/80 min-w-[44px] text-center hover:text-white transition-colors" onClick={resetZoom}>
                {Math.round(scale * 100)}%
              </button>
              <button className="toolbar-btn" onClick={zoomIn} disabled={scale >= MAX_SCALE} aria-label="Vergrößern">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Download */}
            <button className="toolbar-btn" onClick={handleDownload} aria-label="Herunterladen">
              <Download className="w-4 h-4" />
            </button>
          </>
        )}

        <button className="toolbar-btn" onClick={onClose} aria-label="Schließen">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Canvas area */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: "hsl(var(--viewer-bg))" }}>
        <div className="flex justify-center items-start py-6 px-4 min-h-full">
          {isLoading && (
            <div className="flex flex-col items-center justify-center mt-24 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Wird geladen…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center mt-24 gap-3">
              <p className="font-medium text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">Bitte versuche eine andere Datei.</p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg"
              >
                Andere Datei öffnen
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="page-shadow rounded-sm overflow-hidden bg-card">
              <canvas ref={canvasRef} />
            </div>
          )}
        </div>
      </main>

      {/* Mobile bottom bar */}
      {!isLoading && !error && (
        <nav className="sm:hidden flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0">
          <button onClick={() => navigate(-1)} disabled={currentPage <= 1} className="flex items-center gap-1 text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </button>
          <span className="text-sm text-muted-foreground">{currentPage} / {numPages}</span>
          <button onClick={() => navigate(1)} disabled={currentPage >= numPages} className="flex items-center gap-1 text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors">
            Weiter
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
