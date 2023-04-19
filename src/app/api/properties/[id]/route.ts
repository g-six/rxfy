import axios from 'axios';
import { MLSProperty } from '@/_typings/property';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../../response-helper';
import { getNewSessionKey } from '../../update-session';
import { getRecordOwnerId, gqlRequest } from '../../request-helper';
import { DataModel } from '@/_typings/data-models';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_get_loved = `query GetLovedHome($id: ID!) {
  love(id: $id) {
    data {
      id
      attributes {
        property {
          data {
            id
            attributes {
              area
              asking_price
              price_per_sqft
              title
              city
              property_type
              mls_id
              mls_data
            }
          }
        }
      }
    }
  }
}`;

const gql_update = `mutation UpdateLove ($id: ID!, $updates: LoveInput!) {
  love: updateLove (id: $id, data: $updates) {
    data {
      id
      attributes {
        is_highlighted
        agent {
          data {
            id
            attributes {
              full_name
              email
            }
          }
        }
        customer {
          data {
            id
            attributes {
              full_name
              email
            }
          }
        }
        property {
          data {
            id
            attributes {
              mls_id
            }
          }
        }
      }
    }
  }
}`;

const gql_unlove = `mutation LoveUnloveHomes ($id: ID!) {
  love: deleteLove (id: $id) {
    record: data {
      id
      attributes {
        property {
          data {
            attributes {
              mls_id
            }
          }
        }
      }
    }
  }
}`;

export async function GET(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );

  const record_id = Number(request.url.split('/').pop());
  let session_key = '';

  const love_response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_get_loved,
      variables: {
        id: record_id,
      },
    },
    {
      headers,
    },
  );

  if (love_response?.data) {
    const user = await getNewSessionKey(token, guid);
    const { data: response_data } = love_response.data;
    const { id, attributes } = response_data.love.data;

    try {
      return getResponse(
        {
          record: {
            id,
            ...attributes,
          },
          session_key: user.session_key,
        },
        200,
      );
    } catch (e) {
      console.log('Caught Error in loves/[id]/route.GET');
      console.log(e);
      return getResponse({
        error: 'Caught Error in loves/[id]/route.GET',
        session_key: user.session_key,
      });
    }
  }

  return new Response(
    JSON.stringify(
      {
        session_key,
        message: 'Unable to retrieve saved homes',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 400,
    },
  );
}

export async function DELETE(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  const love_id = Number(request.url.split('/').pop());
  if (!isNaN(love_id)) {
    const user = await getNewSessionKey(token, guid);
    if (user) {
      const love_response = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_unlove,
          variables: {
            id: love_id,
          },
        },
        {
          headers,
        },
      );

      return new Response(
        JSON.stringify(
          {
            session_key: user.session_key,
            record: {
              id: Number(love_response.data.data.love.record.id),
              ...love_response.data.data.love.record.attributes,
            },
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
    }
    return new Response(
      JSON.stringify(
        {
          user,
          session_key: user?.session_key,
          message: 'Unable to unlove home',
        },
        null,
        4,
      ),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 400,
      },
    );
  } else {
    return new Response(
      JSON.stringify(
        {
          error: 'Sorry, please login',
        },
        null,
        4,
      ),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 401,
        statusText: 'Sorry, please login',
      },
    );
  }

  return new Response(
    JSON.stringify(
      {
        error: 'Please login',
      },
      null,
      4,
    ),
    {
      headers: {
        'content-type': 'application/json',
      },
      status: 401,
      statusText: 'Please login',
    },
  );
}

/**
 * Update love
 * @param request
 * @returns
 */
export async function PUT(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  const updates = await request.json();
  if (!token && isNaN(guid) && updates)
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  const love_id = Number(request.url.split('/').pop());
  if (!isNaN(love_id)) {
    const owner_id = await getRecordOwnerId(DataModel.LOVE, love_id, 'customer');
    if (owner_id !== guid) {
      return getResponse(
        {
          session_key: `${token}-${guid}`,
          error: 'You are not allowed to make modifications to this record',
        },
        401,
      );
    }
    const { session_key } = await getNewSessionKey(token, guid);
    if (session_key) {
      const res = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_update,
          variables: {
            id: love_id,
            updates,
          },
        },
        {
          headers,
        },
      );

      const { id, attributes } = res.data?.data?.love?.data || {};
      return getResponse(
        {
          record: {
            id,
            ...attributes,
            agent: {
              id: attributes.agent.data.id,
              ...attributes.agent.data.attributes,
            },
            customer: {
              id: attributes.customer.data.id,
              ...attributes.customer.data.attributes,
            },
            property: {
              id: attributes.customer.data.id,
              ...attributes.customer.data.attributes,
            },
          },
          session_key,
        },
        200,
      );
    }
    return getResponse(
      {
        error: 'Unable to update home',
        session_key: `${token}-${guid}`,
      },
      400,
    );
  }
  return getResponse(
    {
      error: 'Sorry, please login',
    },
    401,
  );
}
