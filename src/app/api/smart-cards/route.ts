import axios, { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import { getResponse } from '@/app/api/response-helper';
import { getUserSessionData } from '../check-session/model';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_create = `mutation CreateSmartCard($data: SmartCardInput!) {
    createSmartCard(data: $data) {
        record: data {
            id
            attributes {
                name
                title
                logo_url
                realtor {
                    record: data {
                        id
                    }
                }
            }
        }
    }
}`;
const gql_retrieve_my_cards = `query RetrieveUserWithCards($id: ID!) {
    smartCards(filters: { realtor: { id: { eq: $id } } }, pagination: { pageSize: 100 }, sort: "updatedAt:desc") {
        records: data {
            id
            attributes {
                name
                title
                logo_url
            }
        }
    }
}`;

export async function GET(req: NextRequest) {
  let error = '';
  let session_key = '';
  try {
    const session = await getUserSessionData(req.headers.get('authorization') as string, 'realtor');
    const { session_key: new_session_key } = session as unknown as { session_key: string };
    if (new_session_key) session_key = new_session_key;

    const { data: get_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_retrieve_my_cards,
        variables: {
          id: session.id,
        },
      },
      {
        headers,
      },
    );
    return getResponse({
      records: get_response.data.smartCards.records.map((record: { attributes: {}; id: number }) => ({
        ...record.attributes,
        id: Number(record.id),
      })),
      session_key,
    });
  } catch (e) {
    error = 'Caught exception on GET method in \n  smart-cards/route.ts';
    console.log(error);
    const axios_error = e as AxiosError;
    console.log(axios_error?.response?.data || axios_error?.response || axios_error);
  }
  return getResponse({ error }, 400);
}

export async function POST(req: NextRequest) {
  let error = '';
  let data: { record?: { [key: string]: number | string }; session_key?: string } = {};
  let session_key = '';
  try {
    const payload = await req.json();

    if (!payload.name || !payload.title)
      return getResponse({
        error: 'Name and title are required fields',
      });

    const session = await getUserSessionData(req.headers.get('authorization') as string, 'realtor');
    const { session_key: new_session_key } = session as unknown as { session_key: string };
    if (new_session_key) session_key = new_session_key;

    const { data: create_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_create,
        variables: {
          data: {
            ...payload,
            realtor: session.id,
            publishedAt: new Date().toISOString(),
          },
        },
      },
      {
        headers,
      },
    );

    return getResponse({
      ...data,
      record: create_response.data.createSmartCard.record,
      session_key,
    });
  } catch (e) {
    error = 'Caught exception on POST method in \n  smart-cards/route.ts';
    console.log(error);
    const axios_error = e as AxiosError;
    console.log(axios_error);
  }
  return getResponse({ error }, 400);
}
