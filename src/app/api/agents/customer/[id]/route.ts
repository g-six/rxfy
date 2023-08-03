import axios, { AxiosError } from 'axios';
import { mutation_update_agent_customer } from '../../graphql';
import { NextRequest } from 'next/server';
import { getResponse } from '@/app/api/response-helper';
import { GET as checkSession } from '@/app/api/check-session/route';

export async function PUT(request: NextRequest) {
  const agent = await checkSession(request, true);

  const { customers, session_key } = agent as unknown as {
    customers: { notes: string[]; agent_customer_id: number }[];
    session_key?: string;
  };

  const id = Number(request.url.split('/').pop() || -1);

  const [customer] = customers.filter(c => c.agent_customer_id === id);

  if (customer && session_key)
    try {
      const data = await request.json();

      const variables = {
        id,
        data,
      };

      const { data: response } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: mutation_update_agent_customer,
          variables,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('response.data', response.data);

      if (response.data?.updateAgentsCustomer?.data) {
        const { id, attributes } = response.data.updateAgentsCustomer.data;
        let customer = {
          ...attributes.customer.data.attributes,
          id: Number(attributes.customer.data.id),
        };
        const saved_searches = customer.saved_searches?.data
          ? customer.saved_searches.data.map((s: { attributes: { [key: string]: unknown }; id: number }) => ({
              ...s.attributes,
              id: Number(s.id),
            }))
          : [];
        customer = {
          ...customer,
          saved_searches,
        };
        return getResponse({
          ...attributes,
          customer,
          id: Number(id),
          session_key,
        });
      }
    } catch (e) {
      const errors = e as AxiosError;
      const { message, response } = errors;
      console.log('API Error: agents.customer[id].PUT');
      console.log(response?.data);
      return getResponse(
        {
          error: message,
        },
        400,
      );
    }

  return getResponse(
    {
      error: 'Please login to update customer notes',
    },
    401,
  );
}
