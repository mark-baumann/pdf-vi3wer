import { useState, useCallback, useEffect } from "react";
import { Bookshelf } from "@/components/Bookshelf";
import { PdfViewer } from "@/components/PdfViewer";
import { generateThumbnail } from "@/components/Bookshelf";
import {
  uploadPdf,
  loadAllPdfs,
  deletePdf,
  downloadPdfAsFile,
  getPublicUrl,
  StoredPdf,
} from "@/lib/pdfStorage";
import { Loader2 } from "lucide-react";
import type { PdfEntry } from "@/types/pdf";

const Index = () => {
  const [books, setBooks] = useState<PdfEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<PdfEntry | null>(null);
  const [openFile, setOpenFile] = useState<File | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load existing PDFs from Cloud on mount
  useEffect(() => {
    loadAllPdfs().then((stored: StoredPdf[]) => {
      const entries: PdfEntry[] = stored.map((s) => ({
        id: s.id,
        file: null,
        storagePath: s.storage_path,
        thumbnail: s.thumbnail,
        name: s.name,
        size: s.size,
        publicUrl: getPublicUrl(s.storage_path),
      }));
      setBooks(entries);
      setIsInitialLoading(false);
    });
  }, []);

  const handleAdd = useCallback(async (files: File[]) => {
    for (const file of files) {
      // Optimistic: add immediately with placeholder
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempEntry: PdfEntry = {
        id: tempId,
        file,
        storagePath: "",
        thumbnail: null,
        name: file.name,
        size: file.size,
        publicUrl: "",
      };
      setBooks((prev) => [...prev, tempEntry]);

      // Generate thumbnail first, then upload
      const thumbnail = await generateThumbnail(file);
      const stored = await uploadPdf(file, thumbnail);

      if (stored) {
        const realEntry: PdfEntry = {
          id: stored.id,
          file,
          storagePath: stored.storage_path,
          thumbnail: stored.thumbnail,
          name: stored.name,
          size: stored.size,
          publicUrl: getPublicUrl(stored.storage_path),
        };
        setBooks((prev) =>
          prev.map((b) => (b.id === tempId ? realEntry : b))
        );
      } else {
        // Remove failed entry
        setBooks((prev) => prev.filter((b) => b.id !== tempId));
      }
    }
  }, []);

  const handleRemove = useCallback((id: string) => {
    const entry = books.find((b) => b.id === id);
    if (entry?.storagePath) {
      deletePdf(id, entry.storagePath);
    }
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, [books]);

  const handleOpen = useCallback(async (entry: PdfEntry) => {
    setActiveEntry(entry);
    if (entry.file) {
      setOpenFile(entry.file);
    } else {
      // Download from Cloud storage
      const file = await downloadPdfAsFile(entry.storagePath, entry.name);
      if (file) {
        setOpenFile(file);
        // Cache locally for future opens this session
        setBooks((prev) =>
          prev.map((b) => (b.id === entry.id ? { ...b, file } : b))
        );
      }
    }
  }, []);

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Bibliothek wird geladen…</p>
        </div>
      </div>
    );
  }

  if (activeEntry && openFile) {
    return (
      <PdfViewer
        file={openFile}
        onClose={() => { setActiveEntry(null); setOpenFile(null); }}
      />
    );
  }

  if (activeEntry && !openFile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Dokument wird geöffnet…</p>
        </div>
      </div>
    );
  }

  return (
    <Bookshelf
      books={books}
      onAdd={handleAdd}
      onOpen={handleOpen}
      onRemove={handleRemove}
    />
  );
};

export default Index;
