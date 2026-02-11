import { list } from '@vercel/blob';
import type { IncomingMessage, ServerResponse } from 'http';

type ListRequest = IncomingMessage & {
  method?: string;
};

type JsonResponse = ServerResponse & {
  status: (code: number) => JsonResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: ListRequest, res: JsonResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await list({ prefix: 'pdfs/' });
    return res.status(200).json({ blobs: response.blobs });
  } catch (error) {
    console.error('Blob list failed:', error);
    return res.status(500).json({ error: 'Blob list failed' });
  }
}
