import { Hit, PropertyIndexNode } from '@/_typings/pipeline';

const keep_as_array = ['Status', 'photos'];

export function getSegregatedListings(hits: Hit[]) {
  const active: PropertyIndexNode[] = [];
  const sold: PropertyIndexNode[] = [];
  hits.forEach((hit: Hit) => {
    const { fields } = hit;
    let data: PropertyIndexNode | {} = {};
    Object.keys(fields).forEach(key => {
      const k = key.substring(0, 5) === 'data.' ? key.substring(5) : key;
      data = {
        ...data,
        [k]: Array.isArray(fields[key]) && !keep_as_array.includes(k) ? Array(fields[key]).join(',') : fields[key],
      };
    });
    if ((data as PropertyIndexNode).Status.includes('Active')) {
      active.push(data as PropertyIndexNode);
    } else {
      sold.push(data as PropertyIndexNode);
    }
  });

  return [active, sold];
}

export async function getAgentListings(agent_id: string): Promise<{
  active?: PropertyIndexNode[];
  sold?: PropertyIndexNode[];
}> {
  try {
    // Query cached listings first to save on latency in searching
    let url: string = `https://pages.leagent.com/listings/${agent_id}.json`;
    let res = await fetch(url);
    if (!res.ok || res.headers.get('content-type') !== 'application/json') {
      console.log('Cache file not found', url);
      // If no cached listings results found, let's search
      url = `${process.env.NEXT_PUBLIC_API}/opensearch/agent-listings/${agent_id}`;
      res = await fetch(url, { method: 'POST' });
    }
    if (res.ok && res.headers.get('content-type') === 'application/json') {
      const { hits: results } = await res.json();

      const { hits } = results as {
        hits: Hit[];
      };

      const [active, sold] = getSegregatedListings(
        hits.filter(hit => {
          // Just feed publicly listed properties
          return hit._index !== 'private';
        }),
      );

      return {
        active,
        sold,
      };
    } else {
      console.log('Error in getAgentListings subroutine');
      console.log(' There might be no json file cached for listings');
    }
  } catch (e) {
    console.log('Error in getAgentListings subroutine');
    console.log(e);
  }

  return {};
}
