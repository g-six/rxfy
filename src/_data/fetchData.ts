import { consoler } from '@/_helpers/consoler';
import { getMostRecentListing, getSoldListings } from '@/app/api/agents/model';
const FILE = 'fetchData.ts';
export default async function fetchData(
  context: string,
  filter: string,
  fallback: unknown,
  opts?: {
    sort?: string;
    size?: number;
    filters?: {
      key: string;
      value: string;
    }[];
  },
) {
  if (fallback) {
    if (context === 'property') {
      if (['recent_listings', 'recent_listing', 'sold'].includes(filter)) {
        const { agent_id } = fallback as unknown as {
          agent_id: string;
        };
        if (!opts?.filters && filter === 'sold') {
          // TODO: Refactor to work with other filters
          //        value should be like data-filter="Status:Sold"
          return await getMostRecentListing(agent_id, {
            ...opts,
            filters: [{ key: 'Status', value: filter }],
          });
        }
        return await getMostRecentListing(agent_id, opts);
      }
    }
  }
  return {
    context,
    filter,
  };
}
