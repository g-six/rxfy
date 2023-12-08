import { consoler } from '@/_helpers/consoler';
import { gql_find_realtor } from './gql';

const FILE = 'api/realtors/model.ts';
export async function findRealtorBy(filters: { [k: string]: unknown }) {
  const response = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
    method: 'POST',
    body: JSON.stringify({
      query: gql_find_realtor,
      variables: { filters },
    }),
    headers: {
      Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
      'Content-Type': 'application/json',
    },
  });

  try {
    const json = await response.json();
    if (response.ok) {
      return json;
    } else {
      consoler(FILE, 'Unable to complete findRealtorBy', json);
    }
  } catch (e) {
    consoler(FILE, 'Unable to complete findRealtorBy', response.statusText);
  }
}
