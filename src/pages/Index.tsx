import { useState } from "react";
import { PdfDropZone } from "@/components/PdfDropZone";
import { PdfViewer } from "@/components/PdfViewer";

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  return pdfFile ? (
    <PdfViewer file={pdfFile} onClose={() => setPdfFile(null)} />
  ) : (
    <PdfDropZone onFileSelect={setPdfFile} />
  );
};

export default Index;
