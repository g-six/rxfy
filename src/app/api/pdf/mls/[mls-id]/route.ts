import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { getPdf } from '@/app/api/_helpers/pdf-helper';
import { getPropertyByMlsId } from '@/app/api/properties/model';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';

export async function GET(req: NextRequest) {
  const { origin, searchParams, pathname } = new URL(req.url);

  const mls_id = pathname.split('/').pop();

  if (origin && searchParams.get('agent') && searchParams.get('slug') && mls_id) {
    const agent = await findAgentRecordByAgentId(searchParams.get('agent') as string);
    const data = await getPropertyByMlsId(mls_id);
    const full_data = {
      ...data,
      agent,
    } as unknown;
    const page_url = ['https://', process.env.NEXT_PUBLIC_DEFAULT_THEME_DOMAIN, 'brochure'].join('/');

    const response = await getPdf(page_url, full_data as unknown);

    return getResponse({ body: response }, 200, 'application/pdf');
  }

  return getResponse({ error: 'Unable to fetch pdf' }, 400);
}
