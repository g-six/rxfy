import axios, { AxiosError } from 'axios';
import { mutate_public_listing } from '@/app/api/properties/model';

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
