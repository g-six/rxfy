import axios from 'axios';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../../response-helper';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
function jsonToCSV(
  agents: {
    [key: string]: string;
  }[],
): string {
  let s_csv = '';
  // Iterate through each key in the json object
  for (let key in agents[0]) {
    s_csv += key + ',';
  }

  // Iterate through each value in the json object
  agents.forEach(agent => {
    s_csv += '\n';
    Object.keys(agent).forEach(key => {
      s_csv += (agent[key] as string) + ',';
    });
    s_csv = s_csv.substring(0, s_csv.length - 1);
  });

  return s_csv;
}

const gql_agents = `query GetAgents ($filters: AgentFiltersInput!) {
    agents(filters: $filters, pagination: { limit: 5000 }, sort: ["id:desc"]) {
      data {
        id
        attributes {
          full_name
          email
          phone
        }
      }
    }
}
`;
export async function GET(request: Request) {
  //   const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (request.headers.get('authorization') !== headers.Authorization)
    return getResponse(
      {
        error: 'This API is only available for admins',
      },
      404,
    );
  const xhr_agents = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_agents,
      variables: {
        filters: {},
      },
    },
    {
      headers,
    },
  );

  const data = xhr_agents?.data?.data?.agents?.data;
  const errors = xhr_agents?.data?.errors;
  if (data) {
    return new Response(jsonToCSV(data.map((rec: { id: string; attributes: Record<string, string> }) => ({ id: Number(rec.id), ...rec.attributes }))), {
      headers: {
        'Content-Type': 'application/csv',
        'Content-Disposition': 'attachment; filename="realtors.csv"',
      },
    });
  }

  //   if (!token && isNaN(guid))
  //     return getResponse(
  //       {
  //         error: 'Please log in',
  //       },
  //       401,
  //     );
}
