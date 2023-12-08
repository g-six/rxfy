import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { getPdf } from '@/app/api/_helpers/pdf-helper';
import { getPropertyByMlsId } from '@/app/api/properties/model';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';

// PDF Brochure
const THEMES_WITH_BROCHURE_HTML = ['leagent-webflow-rebuild', 'alicante-leagent'];

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
    let domain = process.env.NEXT_PUBLIC_DEFAULT_THEME_DOMAIN;
    if (agent.webflow_domain && THEMES_WITH_BROCHURE_HTML.includes(agent.webflow_domain.split('.').reverse().pop())) {
      domain = agent.webflow_domain;
    }
    const page_url = ['https://sites.leagent.com', domain, 'brochure.html'].join('/');

    return await getPdf(page_url, full_data as unknown);
  }

  return getResponse({ error: 'Unable to fetch pdf' }, 400);
}
