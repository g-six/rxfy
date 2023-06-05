import axios, { AxiosError } from 'axios';
import { gql_by_agent_id, gql_create_agent } from './graphql';
import { WEBFLOW_THEME_DOMAINS } from '@/_typings/webflow';
import { RealEstateBoardDataModel } from '@/_typings/real-estate-board';
import { AgentInput } from '@/_typings/agent';
import { getSmart } from './repair';

export async function createAgent(user_data: {
  agent_id: string;
  email: string;
  phone?: string;
  encrypted_password?: string;
  full_name: string;
  real_estate_board_id?: number;
}) {
  try {
    const agent_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_create_agent,
        variables: {
          data: {
            agent_id: user_data.agent_id,
            email: user_data.email,
            phone: user_data.phone,
            full_name: user_data.full_name,
            first_name: user_data.full_name.split(' ')[0] || '',
            last_name: user_data.full_name.split(' PREC').join('').split(' ').pop(),
            real_estate_board: user_data.real_estate_board_id,
            webflow_domain: WEBFLOW_THEME_DOMAINS.DEFAULT,
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

    return agent_response?.data?.data?.createAgent?.data || {};
  } catch (e) {
    console.log('Error in createAgent');
    const axerr = e as AxiosError;
    const { error, errors } = axerr.response?.data as {
      error?: {
        code: string;
      };
      errors?: {
        message: string;
        extensions: unknown[];
      }[];
    };
    console.log(
      JSON.stringify(
        {
          error,
          errors,
        },
        null,
        4,
      ),
    );
  }
  return {};
}

export async function createAgentRecordIfNoneFound(
  { agent_id, email, phone, full_name }: AgentInput,
  real_estate_board?: RealEstateBoardDataModel,
  listing?: {
    description: string;
    lat: number;
    lng: number;
    target_area: string;
    target_city: string;
    asking_price: number;
    property_type: string;
    beds: number;
    baths: number;
    listing_date: string;
  },
) {
  if (!email) return;
  if (!agent_id) return;

  if (!full_name) return;

  try {
    // const variables = { email };
    const variables = { agent_id };
    const { data: response_data } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_by_agent_id,
        // query: gql_by_email,
        variables,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    let first_name = `${full_name}`.split(' ')[0];
    let last_name = `${full_name}`.split(' ').slice(0, 2).pop();

    let [agent] = response_data?.data?.agents?.data;

    if (!agent) {
      console.log("Agent not found, let's create it");
      const create_this = {
        agent_id,
        full_name,
        first_name,
        last_name,
        phone,
        email,
        real_estate_board_id: real_estate_board?.id || undefined,
      };
      const t = new Date();
      console.log('timestamp', t.toISOString());
      console.log(create_this);
      agent = await createAgent(create_this);
      console.log('');
      console.log('took', [Date.now() - t.getTime(), 'ms'].join(''));
      console.log('---');
    } else {
      first_name = agent.attributes.full_name.split(' ')[0];
      last_name = agent.attributes.full_name.split(' ').slice(0, 2).pop();
      last_name = (last_name && last_name.split('PREC*').join('').trim()) || '';
      console.log(`Agent found, let's use ${first_name} ${last_name}`);
    }
    if (!agent.attributes?.agent_metatag?.data?.attributes?.personal_bio && listing?.description) {
      console.log('No agent bio, sprucing it up...');
      console.log(agent);
      const agent_attributes: AgentInput & { id: number } & { [key: string]: string | number } = {
        id: Number(agent.id),
        ...agent.attributes,
        first_name,
        last_name,
      };

      Object.keys(agent_attributes).forEach(k => {
        if (agent_attributes[k] === null) delete agent_attributes[k];
      });

      getSmart(agent_attributes, listing, real_estate_board);
    }
    return agent;
  } catch (e) {
    console.log('Caught error in createAgentRecordIfNoneFound');
    console.error(e);
  }
}
