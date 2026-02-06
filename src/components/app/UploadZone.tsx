import { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAddDocument } from '@/hooks/useDocuments';
import type { PDFDocument } from '@/types/pdf';
import { toast } from 'sonner';

interface UploadZoneProps {
  currentFolderId: string | null;
}

export function UploadZone({ currentFolderId }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const addDoc = useAddDocument();
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      toast.error('Nur PDF-Dateien werden unterstützt.');
      return;
    }
    for (const file of pdfFiles) {
      const data = await file.arrayBuffer();
      const doc: PDFDocument = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.pdf$/i, ''),
        size: file.size,
        data,
        folderId: currentFolderId,
        tagIds: [],
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
        bookmarks: [],
      };
      await addDoc.mutateAsync(doc);
    }
    toast.success(`${pdfFiles.length} Dokument${pdfFiles.length > 1 ? 'e' : ''} hochgeladen.`);
  }, [addDoc, currentFolderId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = ''; }}
      />
      {/* Drag overlay */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center"
          onDragOver={e => e.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="rounded-2xl border-2 border-dashed border-primary p-12 text-center">
            <Upload className="h-12 w-12 mx-auto mb-3 text-primary" />
            <p className="text-lg font-medium text-foreground">PDFs hier ablegen</p>
          </div>
        </div>
      )}
      {/* Hidden drop listener for the whole page */}
      <div
        className="fixed inset-0 z-40 pointer-events-none"
        onDragEnter={() => setIsDragging(true)}
        style={{ pointerEvents: isDragging ? 'none' : undefined }}
      />
    </>
  );
}

// Export the trigger function
export function useUploadTrigger() {
  const inputRef = useRef<HTMLInputElement>(null);
  const trigger = () => inputRef.current?.click();
  return { inputRef, trigger };
}
