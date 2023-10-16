import axios from 'axios';
import { gql_create_agent, mutation_create_meta } from '../agents/graphql';
import { AgentMetatagsInput } from '@/_typings/agent';
import { WEBFLOW_THEME_DOMAINS } from '@/_typings/webflow';

export async function createAgent(data: {
  agent_metatag: number;
  agent_id: string;
  email: string;
  phone: string;
  full_name: string;
  street_1: string;
  street_2?: string;
  real_estate_board?: number;
  webflow_domain?: string;
}) {
  const response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_create_agent,
      variables: {
        data: {
          ...data,
          webflow_domain: data.webflow_domain || WEBFLOW_THEME_DOMAINS.DEFAULT,
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
  if (response.data?.data?.createAgent?.data?.id) {
    const id = Number(response.data.data.createAgent.data.id);
    return {
      ...response.data.data.createAgent.data.attributes,
      id,
    };
  }
  console.log('');
  console.log('');
  console.log('Error in new-agent.model.createAgent');
  console.log(JSON.stringify(response.data, null, 4));
  console.log('');
  console.log('');
  return response.data;
}

export async function createAgentMetatag(data: AgentMetatagsInput) {
  console.log('createAgentMetatag', JSON.stringify(data, null, 4));
  const metatag_response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: mutation_create_meta,
      variables: {
        data,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (metatag_response.data?.data?.createAgentMetatag?.data?.id) {
    const id = Number(metatag_response.data.data.createAgentMetatag.data.id);
    return {
      ...metatag_response.data.data.createAgentMetatag.data.attributes,
      id,
    };
  }
  console.log('');
  console.log('');
  console.log('Error in new-agent.model.createAgentMetatag');
  console.log(JSON.stringify(metatag_response.data, null, 4));
  console.log('');
  console.log('');
  return metatag_response.data;
}
