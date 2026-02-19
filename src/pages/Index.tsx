import { useState, useCallback } from "react";
import { Bookshelf, PdfEntry, generateThumbnail } from "@/components/Bookshelf";
import { PdfViewer } from "@/components/PdfViewer";

const Index = () => {
  const [books, setBooks] = useState<PdfEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<PdfEntry | null>(null);

  const handleAdd = useCallback(async (files: File[]) => {
    const newEntries: PdfEntry[] = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      thumbnail: null,
    }));

    setBooks((prev) => [...prev, ...newEntries]);

    // Generate thumbnails asynchronously
    newEntries.forEach(async (entry) => {
      const thumbnail = await generateThumbnail(entry.file);
      if (thumbnail) {
        setBooks((prev) =>
          prev.map((b) => (b.id === entry.id ? { ...b, thumbnail } : b))
        );
      }
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  if (activeEntry) {
    return (
      <PdfViewer
        file={activeEntry.file}
        onClose={() => setActiveEntry(null)}
      />
    );
  }

  return (
    <Bookshelf
      books={books}
      onAdd={handleAdd}
      onOpen={setActiveEntry}
      onRemove={handleRemove}
    />
  );
};

export default Index;
