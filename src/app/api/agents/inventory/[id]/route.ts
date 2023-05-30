import axios, { AxiosError } from 'axios';
import { gql_agent_inventory } from '../../graphql';
import { PropertyDataModel } from '@/_typings/property';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { data: inventory_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_agent_inventory,
        variables: {
          agent: new URL(request.url || '').pathname.split('/').pop(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const properties: Record<string, unknown>[] = [];
    if (inventory_response.data?.inventory?.records) {
      inventory_response.data?.inventory?.records.map(({ id, attributes }: { id: number; attributes: Record<string, unknown> }) => {
        const record = attributes.property as { data: { id: number; attributes: PropertyDataModel } };
        if (record.data.attributes)
          properties.push({
            ...record.data.attributes,
            id: Number(record.data.id),
          });
      });
    }

    return new Response(
      JSON.stringify(
        {
          properties,
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
        error: 'Please login to retrieve documents',
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
