import axios from 'axios';
import { encrypt } from '@/_utilities/encryption-helper';
import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, MLSProperty, PropertyDataModel } from '@/_typings/property';
import { getResponse } from '../response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getNewSessionKey } from '../update-session';
import { getCombinedData } from '@/_utilities/data-helpers/listings-helper';
import { repairIfNeeded } from '../properties/route';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_find_home = `query FindHomeByMLSID($mls_id: String!) {
  properties(filters:{ mls_id:{ eq: $mls_id}}, pagination: {limit:1}) {
    data {
      id
    }
  }
}`;

const gql_get_loved = `query GetLovedHomes($customer: ID!) {
  loves(filters:{ customer: { id: { eq: $customer } }}) {
    data {
      id
      attributes {
        notes
        property {
          data {
            id
            attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
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
            attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
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

export async function GET(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );
  let session_key = `${token}-${guid}`;
  let message = 'Unable to retrieve saved homes';

  const love_response = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_get_loved,
      variables: {
        customer: guid,
      },
    },
    {
      headers,
    },
  );

  if (love_response?.data) {
    const { data: response_data } = love_response.data;
    try {
      const records = response_data.loves.data.map(
        (
          love: Record<
            string,
            {
              notes?: string;
              property: {
                data: {
                  id: number;
                  attributes: PropertyDataModel & {
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
            L_FloorArea_GrantTotal: sqft,
            ...other_fields
          } = love.attributes.property.data.attributes.mls_data;
          let [thumb] = photos ? (photos as string[]).slice(0, 1) : [];
          if (thumb === undefined) {
            thumb = 'https://assets.website-files.com/6410ad8373b7fc352794333b/642df6a57f39e6607acedd7f_Home%20Placeholder-p-500.png';
          }

          // Since there are some old records prior to addition of new fields,
          // attempt to add from mls_data
          const cleaned = getCombinedData(love.attributes.property.data);
          return {
            id: Number(love.id),
            notes: love.attributes.notes || '',
            property: {
              ...cleaned,
              id: Number(love.attributes.property.data.id),
              style: other_fields.B_Style ? other_fields.B_Style : undefined,
              Status: other_fields.Status || 'N/A',
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
      );

      const user = await getNewSessionKey(token, guid);

      if (!user) return getResponse({ message: 'Please log in' }, 401);

      session_key = user.session_key;
      return getResponse(
        {
          session_key,
          records,
        },
        200,
      );
    } catch (e) {
      console.log('Caught error in love response');
      console.log(e);
      return getResponse({ message: 'Caught error in love response' }, 400);
    }
  }

  message = `${message}\nNo valid user session`;

  return getResponse({ message }, 401);
}

export async function POST(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');

  if (!token && isNaN(guid))
    return getResponse(
      {
        error: 'Please log in',
      },
      401,
    );

  const { agent, mls_id } = await request.json();
  let session_key = `${token}-${guid}`;

  if (agent && mls_id) {
    // First, find property
    const find_home_response = await axios.post(
      `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
      {
        query: gql_find_home,
        variables: {
          mls_id,
        },
      },
      {
        headers,
      },
    );

    let property_id = 0;

    if (find_home_response.data?.data?.properties?.data?.length) {
      // Get Strapi ID
      property_id = find_home_response.data.data.properties.data[0].id;
    }

    if (property_id) {
      const user = await getNewSessionKey(token, guid);
      if (!user?.session_key) {
        return getResponse(
          {
            message: 'Please log in',
          },
          401,
        );
      } else {
        session_key = user.session_key;
      }

      const love_response = await axios.post(
        `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
        {
          query: gql_love,
          variables: {
            agent,
            customer: guid,
            property_id,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { property } = love_response.data.data.love.record.attributes;
      const { mls_data, ...rec } = property.data.attributes;
      const repaired = await repairIfNeeded(property.data.id, rec, mls_data);

      return getResponse(
        {
          session_key,
          record: {
            id: Number(love_response.data.data.love.record.id),
            ...love_response.data.data.love.record.attributes,
          },
        },
        200,
      );
    }

    return getResponse(
      {
        session_key,
        message: 'Unable to save home',
      },
      400,
    );
  }

  return getResponse(
    {
      session_key,
      error: 'Please log in',
    },
    401,
  );
}
