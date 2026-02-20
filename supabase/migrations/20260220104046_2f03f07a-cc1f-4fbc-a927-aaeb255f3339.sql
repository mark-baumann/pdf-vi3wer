
-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pdfs', 'pdfs', true, 52428800, ARRAY['application/pdf']);

-- Allow anyone to read PDFs (public bucket)
CREATE POLICY "Public PDF read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

-- Allow anyone to upload PDFs (no auth required)
CREATE POLICY "Public PDF upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs');

-- Allow anyone to delete PDFs
CREATE POLICY "Public PDF delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdfs');

-- Create table to track PDF metadata
CREATE TABLE public.pdf_library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pdf_library ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write (no auth for now)
CREATE POLICY "Public library read" ON public.pdf_library FOR SELECT USING (true);
CREATE POLICY "Public library insert" ON public.pdf_library FOR INSERT WITH CHECK (true);
CREATE POLICY "Public library update" ON public.pdf_library FOR UPDATE USING (true);
CREATE POLICY "Public library delete" ON public.pdf_library FOR DELETE USING (true);
