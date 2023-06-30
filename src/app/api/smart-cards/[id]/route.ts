import axios, { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import { getResponse } from '../../response-helper';
import { getUserSessionData } from '../../check-session/route';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_retrieve = `query RetrieveSmartCard($id: ID!) {
    smartCard(id: $id) {
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

    const { data: retrieve_response } = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_retrieve,
        variables: {
          id,
        },
      },
      {
        headers,
      },
    );

    if (!retrieve_response.data.smartCard.record)
      return getResponse(
        {
          error: 'Smart card not found',
        },
        404,
      );

    return getResponse({
      ...data,
      record: {
        ...retrieve_response.data.smartCard.record.attributes,
        realtor: Number(retrieve_response.data.smartCard.record.attributes.realtor.record.id),
        id: Number(retrieve_response.data.smartCard.record.id),
      },
      session_key,
    });

    if (session.id !== data.record?.realtor)
      return getResponse(
        {
          error: 'Only owners are allowed to delete smart cards',
        },
        401,
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
    data = {
      ...data,
      record: delete_response.data.deleteSmartCard.record,
      session_key,
    };
  } catch (e) {
    error = 'Caught exception on DELETE method in \n  smart-cards/[id]/route.ts';
    console.log(error);
    const axios_error = e as AxiosError;
    console.log(axios_error);
  }
  return getResponse({ error }, 400);
}
