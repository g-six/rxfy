import { removeEmpty } from '@/_helpers/functions';
import { AgentData } from '@/_typings/agent';
import { objectToQueryString } from '@/_utilities/url-helper';
import { gql_by_agent_uniq } from '../agents/graphql';
import axios from 'axios';

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

export function getAgentBaseUrl(agent: AgentData, remote?: boolean) {
  if (agent.domain_name) return remote ? `https://${agent.domain_name}` : '';
  if (agent.agent_id) {
    return remote ? `https://${agent.website_theme || 'app'}.leagent.com/${agent.agent_id}` : `/${agent.agent_id}`;
  }

  return '';
}
export async function getAgentBy(attributes: { [key: string]: string }) {
  const { agent_id, domain_name, profile_slug } = attributes;
  console.log('_helpers/agent-helper.getAgentBy', attributes);
  let filters: {
    agent_id?: {
      eqi: string;
    };
    profile_slug?: {
      eqi: string;
    };
    domain_name?: {
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
  } else if (domain_name) {
    filters = {
      domain_name: {
        eqi: domain_name,
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
    console.log('getAgentBy: agent record does not exist');
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

/**
 * Creates a domain (under the rexify project) using Vercel's API
 * @param domain_name string
 * @param agent_record_id number agents.id
 */
export async function createRealtorVercelDomain(domain_name: string, id: number) {
  console.log(`Creating vercel domain ${domain_name}`);
  try {
    const vercel_headers = {
      Authorization: `Bearer ${process.env.NEXT_APP_VERCEL_TOKEN as string}`,
      'Content-Type': 'application/json',
    };

    const vercel_domains_api_url = `https://api.vercel.com/v9/projects/rexify/domains?teamId=${process.env.NEXT_APP_VERCEL_TEAM_ID}`;

    const vercel_response = await axios.post(vercel_domains_api_url, { name: domain_name }, { headers: vercel_headers });

    if (vercel_response.data?.name) {
      const updated_domain = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_update_agent_domain,
          variables: {
            id,
            data: {
              domain_name: vercel_response.data?.name,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (updated_domain.data?.data?.updateAgent?.data?.attributes?.domain_name) {
        console.log('Updated domain name to', updated_domain.data.data.updateAgent.data.attributes.domain_name);
      }
    }
  } catch (e) {
    console.log('Unable to successfully create vercel domain.');
    console.error(JSON.stringify((e as { response: { data: { error: unknown } } }).response.data.error), null, 4);
  }
}

const gql_update_agent_domain = `mutation UpdateAgent ($id: ID!, $data: AgentInput!) {
  updateAgent(id: $id, data: $data) {
    data {
      id
      attributes {
        domain_name
        webflow_domain
      }
    }
  }
}`;
