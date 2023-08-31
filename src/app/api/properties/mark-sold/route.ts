import { getResponse } from '@/app/api/response-helper';
import axios, { AxiosError } from 'axios';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gql_retrieve = `query GetProperty($filters: PropertyFiltersInput!) {
    properties(filters: $filters) {
      data {
        id
      }
    }
  }
`;
const gql_mark = `mutation AddHistory($input: SoldPropertyInput!) {
    createSoldProperty(data: $input) {
      data {
        id
        attributes {
          date_sold
          sold_at_price
          mls_id
        }
      }
    }
  }`;
export async function POST(request: Request) {
  const payload = await request.json();
  const { date_sold, sold_at_price, mls_id } = payload as unknown as {
    date_sold: string;
    sold_at_price: number;
    mls_id: string;
  };
  try {
    const get_property = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_retrieve,
        variables: {
          filters: {
            mls_id: {
              eqi: mls_id,
            },
          },
        },
      },
      {
        headers,
      },
    );

    if (get_property?.data?.data?.properties) {
      const {
        data: [record],
      } = get_property.data.data.properties || { data: [] };
      if (record) {
        const {
          data: { data },
        } = await axios.post(
          `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
          {
            query: gql_mark,
            variables: {
              input: {
                date_sold: new Date(date_sold).toISOString().split('T')[0],
                sold_at_price: Number(sold_at_price),
                property: Number(record.id),
                mls_id,
              },
            },
          },
          {
            headers,
          },
        );
        return getResponse(data);
      }
      return getResponse(
        record
          ? {
              ...record,
              date_sold: new Date(date_sold).toISOString().split('T')[0],
              sold_at_price: Number(sold_at_price),
              property: Number(record.id),
              mls_id,
            }
          : {},
      );
    }
  } catch (e) {
    console.log(e);
    const axerr = e as unknown as AxiosError;
    return getResponse({ error: axerr.response?.data }, 400);
  }
}
