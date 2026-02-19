import { useCallback, useState } from "react";
import { FileText, Upload } from "lucide-react";

interface PdfDropZoneProps {
  onFileSelect: (file: File) => void;
}

export const PdfDropZone = ({ onFileSelect }: PdfDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type === "application/pdf") {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
          <FileText className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">PDF Viewer</h1>
        <p className="text-muted-foreground mt-2 text-sm">Öffne und lese PDF-Dateien direkt im Browser</p>
      </div>

      <label
        htmlFor="pdf-input"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full max-w-md
          border-2 border-dashed rounded-2xl p-12 cursor-pointer
          transition-all duration-200
          ${isDragging
            ? "border-primary bg-primary/8 scale-[1.02]"
            : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50"
          }
        `}
      >
        <Upload className={`w-10 h-10 mb-4 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
        <p className="text-base font-medium text-foreground mb-1">PDF hierher ziehen</p>
        <p className="text-sm text-muted-foreground mb-4">oder klicken zum Auswählen</p>
        <span className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg">
          Datei auswählen
        </span>
        <input
          id="pdf-input"
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={handleChange}
        />
      </label>

      <p className="mt-6 text-xs text-muted-foreground">
        Unterstützt alle PDF-Versionen · Funktioniert auch auf iOS
      </p>
    </div>
  );
};
