import axios, { AxiosError } from 'axios';
import { gql_agent_inventory, mutate_agent_inventory } from '../../graphql';
import { PropertyDataModel } from '@/_typings/property';
import { NextRequest } from 'next/server';
import { retrieveAgentInventory } from '../model';

export async function GET(request: NextRequest) {
  try {
    const agent_id = new URL(request.url || '').pathname.split('/').pop() as string;

    const records: Record<string, unknown>[] = await retrieveAgentInventory(agent_id);

    return new Response(
      JSON.stringify(
        {
          records,
        },
        null,
        4,
      ),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      },
    );
  } catch (e) {
    const errors = e as AxiosError;
    console.log('API Error: documents.GET');
    console.log(errors.message);
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please login to retrieve agent inventory',
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

export async function PUT(request: NextRequest, { params }: { params: { id: number } }) {
  try {
    const updates = await request.json();
    const { data: inventory_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutate_agent_inventory,
        variables: {
          id: Number(params.id),
          updates,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return new Response(JSON.stringify(inventory_response.data, null, 4), {
      headers: {
        'content-type': 'application/json',
      },
      status: 200,
    });
  } catch (e) {
    const errors = e as AxiosError;
    console.log('API Error: agents.inventory.PUT');
    console.log('   Record ID:', params.id);
    console.log(errors.message);
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please login to update records',
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
