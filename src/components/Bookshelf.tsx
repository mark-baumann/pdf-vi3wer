import { useRef, useEffect, useCallback } from "react";
import { Plus, FileText, Trash2 } from "lucide-react";

export interface PdfEntry {
  id: string;
  file: File;
  thumbnail: string | null; // data URL of first page
}

interface BookshelfProps {
  books: PdfEntry[];
  onAdd: (files: File[]) => void;
  onOpen: (entry: PdfEntry) => void;
  onRemove: (id: string) => void;
}

// Renders first page of a PDF to a small canvas and returns a data URL
async function generateThumbnail(file: File): Promise<string | null> {
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
    const viewport = page.getViewport({ scale: 0.4 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;
    URL.revokeObjectURL(url);
    return canvas.toDataURL("image/jpeg", 0.8);
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
  const name = entry.file.name.replace(/\.pdf$/i, "");
  const size = (entry.file.size / 1024 / 1024).toFixed(1);

  return (
    <div
      className="group relative cursor-pointer flex flex-col rounded-xl overflow-hidden bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="relative bg-muted flex items-center justify-center overflow-hidden"
           style={{ aspectRatio: "3/4" }}>
        {entry.thumbnail ? (
          <img
            src={entry.thumbnail}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <FileText className="w-10 h-10" />
            <span className="text-xs">PDF</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-200" />
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-foreground truncate leading-tight" title={name}>
          {name}
        </p>
        <p className="text-[10px] text-muted-foreground">{size} MB</p>
      </div>

      {/* Remove button */}
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-destructive z-10"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label="Entfernen"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
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
      className="min-h-screen bg-background flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-base font-bold text-foreground tracking-tight">Meine PDFs</h1>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Hinzufügen</span>
        </button>
      </header>

      <main className="flex-1 px-4 py-4">
        {books.length === 0 ? (
          /* Empty state */
          <label
            htmlFor="pdf-input-shelf"
            className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all duration-200 gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">PDFs hierher ziehen</p>
              <p className="text-sm text-muted-foreground mt-1">oder tippen zum Auswählen</p>
            </div>
          </label>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {books.map((entry) => (
              <BookCard
                key={entry.id}
                entry={entry}
                onOpen={() => onOpen(entry)}
                onRemove={() => onRemove(entry.id)}
              />
            ))}
            {/* Add more card */}
            <label
              htmlFor="pdf-input-shelf"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all duration-200 gap-2 min-h-[140px]"
            >
              <Plus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Hinzufügen</span>
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

export { generateThumbnail };
