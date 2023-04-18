import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { MLSProperty } from '@/_typings/property';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '../../response-helper';
import { getNewSessionKey } from '../../update-session';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gqlFindCustomer = `query FindCustomer($id: ID!) {
  customer(id: $id) {
    data {
      id
      attributes {
        email
        last_activity_at
      }
    }
  }
}`;

const gql_update_session = `mutation UpdateCustomerSession ($id: ID!, $last_activity_at: DateTime!) {
  session: updateCustomer(id: $id, data: { last_activity_at: $last_activity_at }) {
    record: data {
      id
      attributes {
        email
        full_name
        phone_number
        birthday
        last_activity_at
        yes_to_marketing
      }
    }
  }
}`;

const gql_find_home = `query FindHomeByMLSID($mls_id: String!) {
  properties(filters:{ mls_id:{ eq: $mls_id}}, pagination: {limit:1}) {
    data {
      id
    }
  }
}`;

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

const gql_love = `mutation LoveHome ($property_id: ID!, $agent: ID!, $customer: ID!) {
  love: createLove(data: { property: $property_id, agent: $agent, customer: $customer }) {
    record:data {
      id
      attributes {
        property {
          data {
            id
            attributes {
              mls_id
            }
          }
        }
        agent {
          data {
            id
            attributes {
              full_name
            }
          }
        }
        customer {
          data {
            id
            attributes {
              full_name
              last_activity_at
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
      headers: {
        Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (love_response?.data) {
    const { data: response_data } = love_response.data;
    const user = await getNewSessionKey(token, guid);

    return new Response(
      JSON.stringify(
        {
          session_key: user.session_key,
          records: response_data.loves.data.map(
            (
              love: Record<
                string,
                {
                  property: {
                    data: {
                      id: number;
                      attributes: Record<string, string | number> & {
                        mls_data: MLSProperty;
                      };
                    };
                  };
                }
              >,
            ) => {
              const {
                asking_price,
                AskingPrice,
                photos,
                L_BedroomTotal: beds,
                L_TotalBaths: baths,
                L_FloorArea_Total: sqft,
              } = love.attributes.property.data.attributes.mls_data;
              let [thumb] = photos ? (photos as string[]).slice(0, 1) : [];
              if (thumb === undefined) {
                thumb = 'https://assets.website-files.com/6410ad8373b7fc352794333b/642df6a57f39e6607acedd7f_Home%20Placeholder-p-500.png';
              }
              return {
                id: Number(love.id),
                property: {
                  id: Number(love.attributes.property.data.id),
                  ...love.attributes.property.data.attributes,
                  asking_price: asking_price || AskingPrice,
                  beds,
                  baths,
                  sqft,
                  photos: [thumb],
                  area:
                    love.attributes.property.data.attributes.area ||
                    love.attributes.property.data.attributes.mls_data.City ||
                    love.attributes.property.data.attributes.mls_data.Area,
                  mls_data: undefined, // Hide prized data
                },
              };
            },
          ),
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
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
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
