import { objectToQueryString } from '@/_utilities/url-helper';

export function getFullAgentRecord(recordset: {
  agent_id: string;
  agent_metatag: { data?: { id: number; attributes: { [key: string]: unknown } } };
  full_name: string;
}) {
  const { agent_id, full_name, agent_metatag } = recordset;
  const metatags = agent_metatag.data
    ? {
        ...agent_metatag.data.attributes,
        id: Number(agent_metatag.data.id),
      }
    : undefined;
  let agent: { [key: string]: unknown } = { agent_id, full_name };
  if (metatags) {
    Object.keys(metatags).forEach(k => {
      const kv: { [key: string]: string | number } = metatags as unknown as {
        [key: string]: string | number;
      };
      if (kv[k]) {
        if (typeof kv[k] === 'string' || typeof kv[k] === 'number') {
          agent = {
            ...agent,
            [k]: !isNaN(Number(kv[k])) ? Number(kv[k]) : kv[k],
          };
        } else if (k === 'search_highlights' && kv[k]) {
          const { labels: search_highlights } = kv[k] as unknown as {
            labels: {
              ne: {
                lat: number;
                lng: number;
              };
              sw: {
                lat: number;
                lng: number;
              };
              lat: number;
              lng: number;
              title: string;
              name: string;
              zoom: number;
            }[];
          };
          search_highlights.forEach(r => {
            agent = {
              ...agent,
              search_highlights: {
                ...(agent.search_highlights as { [key: string]: unknown }),
                [r.title]: {
                  ...r,
                },
              },
            };
            if (agent && !agent.map_config) {
              const map_config = {
                beds: 3,
                baths: 2,
                maxprice: 1000000,
                city: r.title,
                lat: r.lat,
                lng: r.lng,
                zoom: r.zoom,
                nelat: r.ne.lat,
                nelng: r.ne.lng,
                swlat: r.sw.lat,
                swlng: r.sw.lng,
              };
              agent = {
                ...agent,
                map_config: {
                  ...map_config,
                  query: objectToQueryString(map_config),
                },
              };
            }
          });
        }
      }
    });
  }
  if (agent.profile_slug) {
    agent.homepage = `/${agent_id}/${agent.profile_slug}`;
  }
  if (agent.domain_name) {
    agent.homepage = `https://${agent.domain_name}`;
  }
  return agent;
}
