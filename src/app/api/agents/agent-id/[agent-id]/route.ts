import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { findAgentRecordByAgentId } from '../../model';
export const maxDuration = 300;
export async function GET(req: NextRequest) {
  const { pathname } = new URL(req.url);
  const agent_id = pathname.split('/').pop();

  if (agent_id) {
    const agent = await findAgentRecordByAgentId(agent_id);
    return getResponse(agent);
  }

  return getResponse({
    agent_id,
  });
}
