import { consoler } from '@/_helpers/consoler';
import { getMostRecentListing, getSoldListings } from '@/app/api/agents/model';
const FILE = 'fetchData.ts';
export default async function fetchData(context: string, filter: string, fallback: unknown, sort?: string) {
  if (fallback) {
    if (context === 'property') {
      if (filter === 'recent_listing') {
        const { agent_id } = fallback as unknown as {
          agent_id: string;
        };
        return await getMostRecentListing(agent_id);
      }
      if (filter === 'recent_listings') {
        const { agent_id } = fallback as unknown as {
          agent_id: string;
        };
        return await getMostRecentListing(agent_id, 12);
      }

      if (filter === 'sold') {
        const { agent_id, id } = fallback as unknown as {
          agent_id: string;
          id: number;
        };
        if (sort) {
          const sorting = sort.split(':');
          if (sorting.length) {
            if (sorting.length > 0) {
              return getSoldListings(agent_id, 3, {
                [sorting[0] === 'date_sold' ? 'data.UpdateDate' : `data.${sorting[0]}`]: `${sorting.length > 1 ? sorting[1] : 'desc'}` as unknown as
                  | 'asc'
                  | 'desc',
              });
            }
          }
        }
        // return await getMostRecentListing(agent_id);
      }
    }
  }
  return {
    context,
    filter,
  };
}
