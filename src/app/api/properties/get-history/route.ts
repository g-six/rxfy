import axios, { AxiosError } from 'axios';
import { getResponse } from '@/app/api/response-helper';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_property_ids = `query GetPropertyIDs ($filters: PropertyFiltersInput!) {
    properties(filters: $filters) {
      data {
        id
      }
    }
  }
  `;
const gql_sold_history = `query GetSoldHistory ($ids: [ID]) {
    soldProperties(filters: { property: { id: { in: $ids } } }) {
        data {
          attributes {
            sold_at_price
            date_sold
            mls_id
          }
        }
    }
  }
  `;

export async function POST(request: Request) {
  const payload = await request.json();
  const { address, postal_zip_code } = payload as unknown as {
    postal_zip_code: number;
    address: string;
  };
  try {
    const get_property = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_property_ids,
        variables: {
          filters: {
            title: {
              eqi: address,
            },
            postal_zip_code: {
              eqi: postal_zip_code,
            },
          },
        },
      },
      {
        headers,
      },
    );

    if (get_property?.data?.data?.properties) {
      const { data: properties } = get_property.data.data.properties || { data: [] };
      if (properties && properties.length) {
        const ids = properties.map(({ id: property }: { id: number }) => Number(property));
        const history = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: gql_sold_history,
            variables: {
              ids,
            },
          },
          {
            headers,
          },
        );

        return getResponse({
          records: history.data?.data?.soldProperties?.data?.map((p: { attributes: Record<string, string> }) => p.attributes),
        });
      }
    }
  } catch (e) {
    console.log(e);
    const axerr = e as unknown as AxiosError;
    return getResponse({ error: axerr.response?.data }, 400);
  }
}
