import axios, { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import { getResponse } from '../../response-helper';
import { getUserSessionData } from '@/app/api/check-session/model';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_delete = `mutation DeleteSmartCard($id: ID!) {
    deleteSmartCard(id: $id) {
        record: data {
            id
            attributes {
                name
                title
                logo_url
            }
        }
    }
}`;
const gql_update = `mutation UpdateSmartCard($id: ID!, $updates: SmartCardInput!) {
    updateSmartCard(id: $id, data: $updates) {
        record: data {
            id
            attributes {
                name
                title
                logo_url
                front_url
                back_url
            }
        }
    }
}`;

export async function PUT(req: NextRequest, { params }: { params: { id: number } }) {
  let error = '';
  const id = Number(params.id);
  if (!isNaN(id) && id) {
    const updates = await req.json();
    let session_key = '';
    try {
      const session = await getUserSessionData(req.headers.get('authorization') as string, 'realtor');
      const { session_key: new_session_key } = session as unknown as { session_key: string };
      if (new_session_key) session_key = new_session_key;

      const { data: update_response } = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_update,
          variables: {
            id,
            updates,
          },
        },
        {
          headers,
        },
      );
      if (!update_response.data.updateSmartCard?.record)
        return getResponse(
          {
            error: 'Smart card not found',
          },
          404,
        );

      return getResponse({
        record: {
          ...update_response.data.updateSmartCard?.record.attributes,
          id: Number(update_response.data.updateSmartCard?.record.id),
        },
        session_key,
      });
    } catch (e) {
      error = 'Caught exception on UPDATE method in \n  smart-cards/[id]/route.ts';
      console.log(error);
      const axios_error = e as AxiosError;
      console.log(axios_error);
    }
  }
  return getResponse({ error }, 400);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.url.split('/').pop());
  let error = '';
  let data: { record?: { [key: string]: number | string }; session_key?: string } = {};
  let session_key = '';
  try {
    const session = await getUserSessionData(req.headers.get('authorization') as string, 'realtor');
    const { session_key: new_session_key } = session as unknown as { session_key: string };
    if (new_session_key) session_key = new_session_key;

    await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_update,
        variables: {
          id,
          updates: {
            name: 'To Be',
            title: 'Deleted',
          },
        },
      },
      {
        headers,
      },
    );

    const { data: delete_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_delete,
        variables: {
          id,
        },
      },
      {
        headers,
      },
    );

    if (!delete_response.data.deleteSmartCard?.record)
      return getResponse(
        {
          error: 'Smart card not found',
        },
        404,
      );

    return getResponse({
      ...data,
      record: {
        ...delete_response.data.deleteSmartCard?.record.attributes,
        realtor: Number(delete_response.data.deleteSmartCard?.record.attributes.realtor?.record.id),
        id: Number(delete_response.data.deleteSmartCard?.record.id),
      },
      session_key,
    });
  } catch (e) {
    error = 'Caught exception on DELETE method in \n  smart-cards/[id]/route.ts';
    console.log(error);
    const axios_error = e as AxiosError;
    console.log(axios_error);
  }
  return getResponse({ error }, 400);
}
