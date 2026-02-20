import { useRef, useCallback } from "react";
import { Plus, FileText, Trash2, BookOpen, Loader2 } from "lucide-react";
import type { PdfEntry } from "@/types/pdf";

export type { PdfEntry };

interface BookshelfProps {
  books: PdfEntry[];
  onAdd: (files: File[]) => void;
  onOpen: (entry: PdfEntry) => void;
  onRemove: (id: string) => void;
}

// Renders first page of a PDF to a small canvas and returns a data URL
export async function generateThumbnail(file: File): Promise<string | null> {
  try {
    let attempts = 0;
    while (!window.pdfjsLib && attempts < 20) {
      await new Promise((r) => setTimeout(r, 100));
      attempts++;
    }
    if (!window.pdfjsLib) return null;

    const pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const url = URL.createObjectURL(file);
    const pdf = await pdfjsLib.getDocument({ url }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;
    URL.revokeObjectURL(url);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

interface BookCardProps {
  entry: PdfEntry;
  onOpen: () => void;
  onRemove: () => void;
}

const BookCard = ({ entry, onOpen, onRemove }: BookCardProps) => {
  const name = entry.name.replace(/\.pdf$/i, "");
  const isUploading = !entry.storagePath;

  return (
    <div
      className="group relative cursor-pointer select-none"
      onClick={!isUploading ? onOpen : undefined}
    >
      {/* Book spine shadow on the left */}
      <div
        className="absolute left-0 top-1 bottom-1 w-2 rounded-l-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "hsl(var(--primary) / 0.15)" }}
      />

      {/* Card */}
      <div
        className="relative flex flex-col rounded-xl overflow-hidden bg-card border border-border group-hover:border-primary/30 group-hover:shadow-xl transition-all duration-200 active:scale-[0.97]"
        style={{ boxShadow: "0 2px 8px hsl(var(--foreground) / 0.06)" }}
      >
        {/* Thumbnail area */}
        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "3/4" }}>
          {entry.thumbnail ? (
            <img
              src={entry.thumbnail}
              alt={name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-3"
              style={{
                background:
                  "linear-gradient(160deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))",
              }}
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-primary/50 animate-spin" />
              ) : (
                <>
                  <FileText className="w-10 h-10 text-primary/40" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    PDF
                  </span>
                </>
              )}
            </div>
          )}

          {/* Sheen overlay */}
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 transition-colors duration-200" />

          {/* Open indicator */}
          {!isUploading && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-card/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg border border-border">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">Öffnen</span>
              </div>
            </div>
          )}

          {/* Remove button */}
          {!isUploading && (
            <button
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:brightness-110 z-10 shadow"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label="Entfernen"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Uploading badge */}
          {isUploading && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <span className="text-[9px] bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-muted-foreground font-medium">
                Wird hochgeladen…
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="px-2.5 py-2 flex flex-col gap-0.5 border-t border-border/50">
          <p
            className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2"
            title={name}
          >
            {name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {(entry.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      </div>
    </div>
  );
};

export const Bookshelf = ({ books, onAdd, onOpen, onRemove }: BookshelfProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");
      if (pdfs.length) onAdd(pdfs);
    },
    [onAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(var(--background))" }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">Meine PDFs</h1>
            {books.length > 0 && (
              <p className="text-[10px] text-muted-foreground leading-tight">
                {books.length} {books.length === 1 ? "Dokument" : "Dokumente"}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors active:scale-95 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Hinzufügen</span>
        </button>
      </header>

      <main className="flex-1 px-4 py-5">
        {books.length === 0 ? (
          <label
            htmlFor="pdf-input-shelf"
            className="flex flex-col items-center justify-center h-[65vh] border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-200 gap-5"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.08)" }}
            >
              <BookOpen className="w-10 h-10 text-primary/60" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">PDFs hierher ziehen</p>
              <p className="text-sm text-muted-foreground mt-1">oder tippen zum Auswählen</p>
            </div>
          </label>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {books.map((entry) => (
              <BookCard
                key={entry.id}
                entry={entry}
                onOpen={() => onOpen(entry)}
                onRemove={() => onRemove(entry.id)}
              />
            ))}

            {/* Add more tile */}
            <label
              htmlFor="pdf-input-shelf"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/40 hover:bg-primary/[0.03] transition-all duration-200 gap-2 min-h-[130px]"
              style={{ aspectRatio: "3/4" }}
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Hinzufügen</span>
            </label>
          </div>
        )}
      </main>

      <input
        ref={inputRef}
        id="pdf-input-shelf"
        type="file"
        accept="application/pdf"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};
