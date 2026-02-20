import { supabase } from "@/integrations/supabase/client";

export interface StoredPdf {
  id: string;
  name: string;
  size: number;
  storage_path: string;
  thumbnail: string | null;
  created_at: string;
}

const BUCKET = "pdfs";

export async function uploadPdf(file: File, thumbnail: string | null): Promise<StoredPdf | null> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${id}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return null;
  }

  const { error: dbError } = await supabase.from("pdf_library").insert({
    id,
    name: file.name,
    size: file.size,
    storage_path: path,
    thumbnail,
  });

  if (dbError) {
    console.error("DB insert error:", dbError);
    return null;
  }

  return { id, name: file.name, size: file.size, storage_path: path, thumbnail, created_at: new Date().toISOString() };
}

export async function loadAllPdfs(): Promise<StoredPdf[]> {
  const { data, error } = await supabase
    .from("pdf_library")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Load error:", error);
    return [];
  }
  return data ?? [];
}

export async function deletePdf(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
  await supabase.from("pdf_library").delete().eq("id", id);
}

export async function updateThumbnail(id: string, thumbnail: string): Promise<void> {
  await supabase.from("pdf_library").update({ thumbnail }).eq("id", id);
}

export async function downloadPdfAsFile(storagePath: string, name: string): Promise<File | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) {
    console.error("Download error:", error);
    return null;
  }
  return new File([data], name, { type: "application/pdf" });
}

export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
