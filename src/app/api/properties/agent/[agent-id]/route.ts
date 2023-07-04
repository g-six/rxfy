import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const agent_id = req.url.split('/').pop();
  return getResponse({
    agent_id,
  });
}
