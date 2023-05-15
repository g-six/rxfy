import axios, { AxiosError } from 'axios';
import { gql_create_agent } from './graphql';
import { WEBFLOW_THEME_DOMAINS } from '@/_typings/webflow';

export async function createAgent(user_data: {
  agent_id: string;
  email: string;
  phone: string;
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
