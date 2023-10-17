import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { domain: string; filename: string } }) {
  let url = `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}`;
  url = url + `/${params.domain}`;
  url = url + `/${params.filename}`;
  const file_req = await fetch(url);
  const data = await file_req.text();
  return getResponse({ body: data }, 200, 'text/javascript');
}
