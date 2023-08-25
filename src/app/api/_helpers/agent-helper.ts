import { removeEmpty } from '@/_helpers/functions';
import { AgentData } from '@/_typings/agent';
import { objectToQueryString } from '@/_utilities/url-helper';
import { gql_by_agent_uniq } from '../agents/graphql';

export function getFullAgentRecord(recordset: {
  agent_metatag: { data?: { id: number; attributes: { [key: string]: unknown } } };
  agent_id: string;
  full_name: string;
  webflow_domain?: string;
  website_theme?: string;
}) {
  const { agent_id, full_name, agent_metatag, webflow_domain, website_theme } = recordset;
  const metatags = agent_metatag.data
    ? {
        ...agent_metatag.data.attributes,
        id: Number(agent_metatag.data.id),
      }
    : undefined;
  let agent: { [key: string]: unknown } = { agent_id, full_name, webflow_domain, website_theme };
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
          let { labels: search_highlights } = kv[k] as unknown as {
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

          if (search_highlights) {
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
          } else {
            const search_highlights = kv[k] as unknown as {
              lat: number;
              lng: number;
              nelat: number;
              nelng: number;
              swlat: number;
              swlng: number;
              name: string;
              address: string;
              area?: string;
              city: string;
              postal_zip_code: string;
              state_province: string;
              country: string;
              place_id: string;
              neighbourhood?: string;
            }[];

            if (agent && !agent.map_config && search_highlights.length) {
              const map_config = {
                beds: 3,
                baths: 2,
                maxprice: 1000000,
                ...search_highlights[0],
              };
              agent = {
                ...agent,
                map_config: {
                  ...map_config,
                  query: objectToQueryString(map_config),
                },
              };
            }

            agent = {
              ...agent,
              search_highlights,
            };
          }
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
  return removeEmpty(agent);
}

export function getAgentBaseUrl(agent: AgentData) {
  if (agent.domain_name) return `https://${agent.domain_name}`;
  if (agent.metatags) return `/${agent.agent_id}/${agent.metatags.profile_slug}`;

  return '';
}
export async function getAgentBy(attributes: { [key: string]: string }) {
  const { agent_id, profile_slug } = attributes;

  let filters: {
    agent_id?: {
      eqi: string;
    };
    profile_slug?: {
      eqi: string;
    };
  } = {};
  if (agent_id) {
    filters = {
      agent_id: {
        eqi: agent_id,
      },
    };
  } else if (profile_slug) {
    filters = {
      agent_id: {
        eqi: agent_id,
      },
    };
  } else {
    return;
  }

  const query = {
    query: gql_by_agent_uniq,
    variables: {
      filters,
    },
  };
  const results = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
    method: 'POST',
    body: JSON.stringify(query),
    headers: {
      Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
      'Content-Type': 'application/json',
    },
  });

  const response_data = await results.json();

  let [record] = response_data?.data?.agents.data;
  if (!record) {
    // agent record does not exist,
    console.log('agent record does not exist');
    return;
  }
  return record?.attributes
    ? {
        ...record.attributes,
        id: Number(record.id),
        metatags: {
          ...record.attributes.agent_metatag.data?.attributes,
          id: record.attributes.agent_metatag.data ? Number(record.attributes.agent_metatag.data.id) : undefined,
        },
      }
    : null;
}
