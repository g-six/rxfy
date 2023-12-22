import { consoler } from '@/_helpers/consoler';
import { getMostRecentListing } from '@/app/api/agents/model';
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
      if (['recent_listings', 'recent_listing', 'sold'].includes(filter) || filter.split(':').length === 2 || filter.split('=').length === 2) {
        const { agent_id } = fallback as unknown as {
          agent_id: string;
        };
        if (!opts?.filters) {
          // TODO: Refactor to work with other filters
          //        value should be like data-filter="Status:Sold"
          if (filter.includes('recent_listing')) {
            return await getMostRecentListing(agent_id, {
              ...opts,
            });
          } else if (filter === 'sold')
            return await getMostRecentListing(agent_id, {
              ...opts,
              filters: [{ key: 'Status', value: filter }],
            });
          else if (filter.split(':').length === 2) {
            //        value should be like data-filter="Status:Sold"
            const [key, value] = filter.split(':');
            const listings = await getMostRecentListing(agent_id, {
              ...opts,
              filters: [{ key, value }],
            });
            return listings;
          }
        } else {
          consoler(FILE, { opts });
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
