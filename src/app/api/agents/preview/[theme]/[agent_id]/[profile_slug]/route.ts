import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { theme: string; agent_id: string; profile_slug: string } }) {
  const { origin, searchParams } = new URL(req.url);

  if (origin) {
    const mls_id = searchParams.get('mls');
    const url = `/${params.agent_id}/${params.profile_slug}${mls_id ? `/property?mls=${mls_id}&` : '?'}${
      params.theme !== 'default' ? `theme=${params.theme}&` : ''
    }preview=1`;
    const page_req = await fetch(url);
    const html = await page_req.text();
    console.log(html);
    const image = await fetch(`https://cloudcapture.cc/api/grab?url=${url}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `API_KEY ${process.env.NEXT_APP_CLOUDCAPTURE_API_KEY}`,
      },
    });

    return image;

    const image_blob = await image.blob();

    const blob = await put(`${params.agent_id}-${params.theme}-${mls_id ? `-mls-${mls_id}` : ''}.jpg`, image_blob, {
      access: 'public',
    });

    return getResponse(blob);
  }

  return getResponse({ error: 'Unable to fetch website' }, 400);
}
