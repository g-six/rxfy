import axios, { AxiosError } from 'axios';
import { getPropertyByMlsId, mutate_public_listing } from '@/app/api/properties/model';
import { gql_agent_inventory } from '../graphql';
import { PropertyDataModel } from '@/_typings/property';

export async function retrieveAgentInventory(agent: string, query = gql_agent_inventory) {
  const { data: inventory_response } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query,
      variables: {
        agent,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const records: Record<string, unknown>[] = [];
  if (inventory_response.data?.inventory?.records) {
    let mls_ids: string[] = [];
    inventory_response.data?.inventory?.records.map(({ id, attributes }: { id: number; attributes: Record<string, unknown> }) => {
      const { mls_id, property } = attributes;
      const record = property as { data?: { id: number; attributes: PropertyDataModel } };
      if (record.data?.attributes) {
        records.push({
          ...record.data.attributes,
          id: Number(record.data.id),
        });
      } else {
        if (mls_id) mls_ids.push(mls_id as string);
      }
    });

    if (mls_ids.length) {
      const properties = await Promise.all(mls_ids.map(mls_id => getPropertyByMlsId(mls_id as string)));
      console.log(properties);
      properties.forEach(property => {
        records.push(property as unknown as Record<string, unknown>);
      });
    }
  }
  return records;
}
export async function updatePublicListing(id: number, updates: { [k: string]: unknown }) {
  try {
    const { data: inventory_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: mutate_public_listing,
        variables: {
          id,
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
    return inventory_response;
  } catch (e) {
    console.error('Error in api.agents.inventory.model.ts');
    console.error(`         updatePublicListing(${id}, ${JSON.stringify(updates, null, 16)})`);
    console.error(e);
    const { response } = e as AxiosError;
    if (response?.data) {
      const { errors } = response.data as {
        errors: [];
      };
      console.error(JSON.stringify(errors || []));
    } else {
      console.error(response);
    }
  }
}
