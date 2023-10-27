import { getResponse } from '@/app/api/response-helper';
import { NextRequest } from 'next/server';
import { findAgentRecordByAgentId, getMostRecentListing } from '../../model';
import { retrieveAgentInventory } from '../../inventory/model';
import { gql_agent_id_inventory } from '../../graphql';
export const maxDuration = 300;
export async function GET(req: NextRequest) {
  const { pathname, searchParams } = new URL(req.url);
  const agent_id = pathname.split('/').pop();

  if (agent_id) {
    if (searchParams.get('only')?.includes('inventory')) {
      const inventory = await getMostRecentListing(agent_id, '');
      // const inventory = await retrieveAgentInventory(agent_id, gql_agent_id_inventory)
      return getResponse(inventory as any);
    }
    const agent = await findAgentRecordByAgentId(agent_id);
    return getResponse(agent);
  }

  return getResponse({
    agent_id,
  });
}
