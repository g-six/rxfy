import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { getPrivateListing } from '../../model';
import { getPdf } from '@/app/api/_helpers/pdf-helper';

export async function GET(req: NextRequest) {
  const { origin, searchParams, pathname } = new URL(req.url);

  const lid = pathname.split('/').reverse().slice(1, 2).pop();
  const id = Number(lid);

  if (origin && searchParams.get('agent') && searchParams.get('slug') && !isNaN(id)) {
    const data = await getPrivateListing(id);

    const page_url = ['https://', process.env.NEXT_PUBLIC_DEFAULT_THEME_DOMAIN, 'brochure'].join('/');
    return await getPdf(page_url, data as unknown);
  }

  return getResponse({ error: 'Unable to fetch pdf' }, 400);
}
