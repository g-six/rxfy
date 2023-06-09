import { NextRequest } from 'next/server';
import { createWebsiteScript } from './model';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../response-helper';

export async function POST(req: NextRequest) {
  const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  let session_key = `${token}-${guid}`;
  const payload = await req.json();
  if (payload.script && payload.placement && payload.agent_metatag) {
    const record = await createWebsiteScript(payload);
    return getResponse(record);
  }
}
