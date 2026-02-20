import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  Download,
  Menu,
  X,
  ArrowLeftRight,
  ArrowUpDown,
} from "lucide-react";

interface PdfViewerProps {
  file: File;
  onClose: () => void;
}

type ScrollMode = "vertical" | "horizontal";

const MIN_SCALE = 0.25;
const MAX_SCALE = 4.0;
const SCALE_STEP = 0.25;

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const PdfViewer = ({ file, onClose }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [displayScale, setDisplayScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInputValue, setPageInputValue] = useState("1");
  const [isFitMode, setIsFitMode] = useState(true);
  const [scrollMode, setScrollMode] = useState<ScrollMode>("vertical");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<Map<number, any>>(new Map());
  const objectUrlRef = useRef<string | null>(null);
  const fitScaleRef = useRef<number>(1.0);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
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

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;

      setIsLoading(true);
      setError(null);
      setCurrentPage(1);
      setPageInputValue("1");
      setScale(1);
      setDisplayScale(1);
      setIsFitMode(true);

      try {
        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("PDF load error:", err);
        setError("PDF konnte nicht geladen werden.");
        setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const computeFitScale = useCallback(
    (page: any): number => {
      const container = containerRef.current;
      if (!container) return 1;

      const viewport = page.getViewport({ scale: 1 });
      if (scrollMode === "horizontal") {
        const containerHeight = Math.max(container.clientHeight - 48, 200);
        return Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, containerHeight / viewport.height)
        );
      }

      const containerWidth = Math.max(container.clientWidth - 56, 200);
      return Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, containerWidth / viewport.width)
      );
    },
    [scrollMode]
  );

  const renderSinglePage = useCallback(
    async (pageNum: number, renderScale: number) => {
      const pdf = pdfDocRef.current;
      if (!pdf) return;

      const previousTask = renderTaskRef.current.get(pageNum);
      if (previousTask) {
        previousTask.cancel();
      }

      let page: any;
      try {
        page = await pdf.getPage(pageNum);
      } catch {
        return;
      }

      const canvas = canvasRefs.current.get(pageNum);
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: renderScale * dpr });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current.set(pageNum, task);

      try {
        await task.promise;
      } catch (e: any) {
        if (e?.name !== "RenderingCancelledException") {
          console.error(e);
        }
      }
    },
    []
  );

  const renderAllPages = useCallback(
    async (renderScale: number) => {
      const pdf = pdfDocRef.current;
      if (!pdf || numPages === 0) return;

      for (let page = 1; page <= numPages; page++) {
        await renderSinglePage(page, renderScale);
      }
    },
    [numPages, renderSinglePage]
  );

  useEffect(() => {
    if (isLoading || error || numPages === 0) return;

    const doRender = async () => {
      const pdf = pdfDocRef.current;
      if (!pdf) return;

      const firstPage = await pdf.getPage(1).catch(() => null);
      if (!firstPage) return;

      let activeScale = scale;
      if (isFitMode) {
        const fit = computeFitScale(firstPage);
        fitScaleRef.current = fit;
        activeScale = fit;
        setScale(fit);
        setDisplayScale(fit);
      } else {
        setDisplayScale(scale);
      }

      await renderAllPages(activeScale);
    };

    doRender();
  }, [isLoading, error, numPages, scale, isFitMode, computeFitScale, renderAllPages]);

  useEffect(() => {
    if (!isFitMode) return;

    const observer = new ResizeObserver(async () => {
      const pdf = pdfDocRef.current;
      if (!pdf) return;
      const firstPage = await pdf.getPage(1).catch(() => null);
      if (!firstPage) return;

      const fit = computeFitScale(firstPage);
      fitScaleRef.current = fit;
      setScale(fit);
      setDisplayScale(fit);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [computeFitScale, isFitMode]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const scrollToPage = useCallback((page: number) => {
    const element = pageRefs.current.get(page);
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  }, []);

  const navigate = (delta: number) => {
    const next = Math.min(numPages, Math.max(1, currentPage + delta));
    setCurrentPage(next);
    setPageInputValue(String(next));
    scrollToPage(next);
  };

  const zoomIn = () => {
    setIsFitMode(false);
    const next = Math.min(MAX_SCALE, +(scale + SCALE_STEP).toFixed(2));
    setScale(next);
    setDisplayScale(next);
  };

  const zoomOut = () => {
    setIsFitMode(false);
    const next = Math.max(MIN_SCALE, +(scale - SCALE_STEP).toFixed(2));
    setScale(next);
    setDisplayScale(next);
  };

  const fitViewport = () => {
    setIsFitMode(true);
  };

  const commitPageInput = () => {
    const parsed = parseInt(pageInputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      setCurrentPage(parsed);
      scrollToPage(parsed);
    } else {
      setPageInputValue(String(currentPage));
    }
  };

  const handleDownload = () => {
    if (!objectUrlRef.current) return;
    const a = document.createElement("a");
    a.href = objectUrlRef.current;
    a.download = file.name;
    a.click();
  };

  const toggleScrollMode = () => {
    setScrollMode((prev) => (prev === "vertical" ? "horizontal" : "vertical"));
    setIsFitMode(true);
  };

  const syncCurrentPageFromScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const containerRect = container.getBoundingClientRect();
    const referencePoint =
      scrollMode === "horizontal"
        ? containerRect.left + containerRect.width / 2
        : containerRect.top + containerRect.height / 2;

    let nearestPage = currentPage;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let page = 1; page <= numPages; page++) {
      const pageElement = pageRefs.current.get(page);
      if (!pageElement) continue;

      const pageRect = pageElement.getBoundingClientRect();
      const center =
        scrollMode === "horizontal"
          ? pageRect.left + pageRect.width / 2
          : pageRect.top + pageRect.height / 2;

      const distance = Math.abs(center - referencePoint);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = page;
      }
    }

    if (nearestPage !== currentPage) {
      setCurrentPage(nearestPage);
      setPageInputValue(String(nearestPage));
    }
  }, [currentPage, numPages, scrollMode]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      <header className="z-10 flex items-center justify-between border-b border-border bg-card/90 px-4 py-2 backdrop-blur-sm">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
          {!isLoading && !error && (
            <p className="text-xs text-muted-foreground">
              Seite {currentPage} von {numPages}
            </p>
          )}
        </div>
        <button className="toolbar-btn" onClick={() => setIsMenuOpen((prev) => !prev)} aria-label="Menü öffnen">
          {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {isMenuOpen && !isLoading && !error && (
        <div className="absolute right-3 top-14 z-20 w-[min(92vw,360px)] rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            <button className="flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 text-sm hover:bg-muted" onClick={onClose}>
              <ChevronLeft className="h-4 w-4" /> Zurück
            </button>
            <button className="flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 text-sm hover:bg-muted" onClick={handleDownload}>
              <Download className="h-4 w-4" /> Download
            </button>
            <button className="flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 text-sm hover:bg-muted" onClick={toggleScrollMode}>
              {scrollMode === "vertical" ? <ArrowLeftRight className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
              {scrollMode === "vertical" ? "Horizontal" : "Vertikal"}
            </button>
            <button className="flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 text-sm hover:bg-muted" onClick={fitViewport}>
              Fit ({Math.round(displayScale * 100)}%)
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button className="toolbar-btn" onClick={() => navigate(-1)} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <input
                type="text"
                inputMode="numeric"
                value={pageInputValue}
                onChange={(e) => setPageInputValue(e.target.value)}
                onBlur={commitPageInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitPageInput();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-12 rounded-md border border-border bg-background py-0.5 text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <span>/ {numPages}</span>
            </div>
            <button className="toolbar-btn" onClick={() => navigate(1)} disabled={currentPage >= numPages}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            <button className="toolbar-btn" onClick={zoomOut} disabled={scale <= MIN_SCALE}>
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-14 text-center text-xs text-muted-foreground">
              {Math.round(displayScale * 100)}%
            </span>
            <button className="toolbar-btn" onClick={zoomIn} disabled={scale >= MAX_SCALE}>
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{
          backgroundColor: "hsl(var(--viewer-bg))",
          touchAction: scrollMode === "horizontal" ? "pan-x" : "pan-y",
        }}
        onScroll={syncCurrentPageFromScroll}
      >
        <div
          className={
            scrollMode === "horizontal"
              ? "flex min-h-full w-max items-center gap-6 px-6 py-4"
              : "flex min-h-full flex-col items-center gap-6 px-4 py-6"
          }
        >
          {isLoading && (
            <div className="mt-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Wird geladen…</p>
            </div>
          )}

          {error && (
            <div className="mt-24 flex flex-col items-center justify-center gap-3">
              <p className="font-medium text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground">Bitte versuche eine andere Datei.</p>
              <button
                onClick={onClose}
                className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Zurück zum Bücherregal
              </button>
            </div>
          )}

          {!isLoading &&
            !error &&
            Array.from({ length: numPages }, (_, idx) => idx + 1).map((pageNum) => (
              <div
                key={pageNum}
                ref={(node) => {
                  if (node) pageRefs.current.set(pageNum, node);
                  else pageRefs.current.delete(pageNum);
                }}
                className="page-shadow shrink-0 overflow-hidden rounded-sm bg-card"
                style={{ userSelect: "text", WebkitUserSelect: "text" }}
              >
                <canvas
                  ref={(node) => {
                    if (node) canvasRefs.current.set(pageNum, node);
                    else canvasRefs.current.delete(pageNum);
                  }}
                  style={{ display: "block" }}
                />
              </div>
            ))}
        </div>
      </main>
    </div>
  );
};
