import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const meta_id = Number(req.url.split('/').pop() as string);
  if (!isNaN(meta_id)) {
  }
}
