import { Hit } from '@/_typings/pipeline';
import { MLSProperty } from '@/_typings/property';

const keep_as_array = ['Status', 'photos'];

export function getSegregatedListings(hits: Hit[]) {
  const active: MLSProperty[] = [];
  const sold: MLSProperty[] = [];
  hits.forEach((hit: Hit) => {
    const { fields } = hit;
    let data: MLSProperty | {} = {};
    Object.keys(fields).forEach(key => {
      const k = key.substring(0, 5) === 'data.' ? key.substring(5) : key;
      data = {
        ...data,
        [k]: Array.isArray(fields[key]) && !keep_as_array.includes(k) ? Array(fields[key]).join(',') : fields[key],
      };
    });
    if ((data as MLSProperty).Status.includes('Active')) {
      active.push(data as MLSProperty);
    } else {
      sold.push(data as MLSProperty);
    }
  });

  return [active, sold];
}

export async function getAgentListings(agent_id: string): Promise<{
  active?: MLSProperty[];
  sold?: MLSProperty[];
}> {
  try {
    // Query cached listings first to save on latency in searching
    let url: string = `https://pages.leagent.com/listings/${agent_id}.json`;
    let res = await fetch(url);
    const content_type = res.headers.get('content-type') as string;
    if (!res.ok || content_type.indexOf('/json') === -1) {
      console.log('Cache file not found', url);
    } else {
      console.log('Cache file for featured listings grid found', url);
    }
    if (res.ok && content_type.indexOf('/json') > 0) {
      const { hits: results } = await res.json();

      const { hits } = results as {
        hits: Hit[];
      };
      console.log('');
      console.log('----- getAgentListings ----');
      console.log(JSON.stringify(hits[0], null, 4));
      console.log('--------------------\n\n');

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
