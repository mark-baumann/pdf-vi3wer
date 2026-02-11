import { put } from '@vercel/blob';
import type { IncomingMessage, ServerResponse } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

type UploadRequest = IncomingMessage & {
  method?: string;
  query?: {
    filename?: string | string[];
  };
};

type JsonResponse = ServerResponse & {
  status: (code: number) => JsonResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: UploadRequest, res: JsonResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const filenameParam = req.query?.filename;
  const filename = Array.isArray(filenameParam) ? filenameParam[0] : filenameParam;

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'filename query parameter is required' });
  }

  try {
    const blob = await put(filename, req, {
      access: 'public',
      addRandomSuffix: false,
    });

    return res.status(200).json(blob);
  } catch (error) {
    console.error('Blob upload failed:', error);
    return res.status(500).json({ error: 'Blob upload failed' });
  }
}
