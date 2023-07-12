import axios, { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import { getResponse } from '../../response-helper';
import { getUserSessionData } from '../../check-session/route';

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

export async function DELETE(req: NextRequest) {
  const id = Number(req.url.split('/').pop());
  let error = '';
  let data: { record?: { [key: string]: number | string }; session_key?: string } = {};
  let session_key = '';
  try {
    const session = await getUserSessionData(req.headers.get('authorization') as string, 'realtor');
    const { session_key: new_session_key } = session as unknown as { session_key: string };
    if (new_session_key) session_key = new_session_key;

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
    console.log(delete_response);
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
