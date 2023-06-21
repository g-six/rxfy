import axios, { AxiosError } from 'axios';
import { mutation_update_agent_customer } from '../../graphql';
import { NextRequest } from 'next/server';
import { getResponse } from '@/app/api/response-helper';
import { GET as checkSession } from '@/app/api/check-session/route';

export async function PUT(request: NextRequest) {
  const agent = await checkSession(request);
  const { customers } = agent as unknown as {
    customers: { notes: string[]; id: number }[];
  };
  const id = Number(request.url.split('/').pop() || -1);

  const [customer] = customers.filter(c => c.id === id);
  try {
    let { notes } = customer;
    const data = await request.json();
    const {
      notes: new_notes,
      note_idx,
      ...updates
    } = data as unknown as {
      notes: string;
      note_idx?: number;
    };
    if (note_idx !== undefined && note_idx < notes.length) {
      notes.splice(note_idx, 0, new_notes);
    } else if (notes.length) {
      notes.push(new_notes);
    } else {
      notes = [new_notes];
    }

    const variables = {
      id,
      data: {
        ...updates,
        notes,
      },
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

    if (response.data?.updateAgentsCustomer?.data) {
      const { id, attributes } = response.data.updateAgentsCustomer.data;
      let customer = {
        ...attributes.customer.data.attributes,
        id: Number(attributes.customer.data.id),
      };
      const saved_searches = customer.saved_searches?.data
        ? customer.saved_searches.data.map(s => ({
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

  return new Response(
    JSON.stringify(
      {
        error: 'Please login to update customer notes',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
    },
  );
}
