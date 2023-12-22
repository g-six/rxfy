export const gql_brokerage = `query GetBrokerageBy($filters: BrokerageFiltersInput!) {
    brokerages(filters: $filters) {
      data {
        id
        attributes {
          name
          agents {
            data {
              attributes {
                agent_id
              }
            }
          }
        }
      }
    }
}`;

interface Brokerage {
  id?: number;
  name: string;
  agents?: string[];
}
export async function getAgentBrokerages(agent_id: string): Promise<Brokerage[]> {
  const query = {
    query: gql_brokerage,
    variables: {
      filters: {
        agents: {
          agent_id: {
            eqi: agent_id,
          },
        },
      },
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
  return response_data?.data?.brokerages.data
    ? response_data?.data?.brokerages.data.map((b: { attributes: { [k: string]: any }; id: number }) => {
        const { id, attributes } = b;
        const { agents, ...brokerage } = attributes;
        return {
          ...brokerage,
          agents: (agents.data || []).map((agent: { attributes: { agent_id: string } }) => agent.attributes.agent_id).filter((a: string) => a !== agent_id),
          id: Number(id),
        };
      })
    : [];
}
