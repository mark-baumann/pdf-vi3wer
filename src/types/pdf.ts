export interface PdfEntry {
  id: string;
  file: File | null;        // null if not yet downloaded from cloud
  storagePath: string;
  thumbnail: string | null;
  name: string;
  size: number;
  publicUrl: string;
}
