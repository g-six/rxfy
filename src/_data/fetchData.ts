import { MLSProperty } from '@/_typings/property';
import { retrieveAgentInventory } from '@/app/api/agents/inventory/model';
import { getMostRecentListing } from '@/app/api/agents/model';

export default async function fetchData(context: string, filter: string, fallback: unknown) {
  if (fallback) {
    if (context === 'property') {
      if (filter === 'recent_listing') {
        const { agent_id } = fallback as unknown as {
          agent_id: string;
        };
        return await getMostRecentListing(agent_id);
      }
    }
  }
  return {
    context,
    filter,
  };
}
