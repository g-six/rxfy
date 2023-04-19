import axios from 'axios';
import { MLSProperty } from '@/_typings/property';
import { getResponse } from '../response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getNewSessionKey } from '../update-session';
const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const gql_find_home = `query FindHomeByMLSID($mls_id: String!) {
  properties(filters:{ mls_id:{ eq: $mls_id}}, pagination: {limit:1}) {
    data {
      id
      attributes {
        lat
        lon
        property_type
        area
        city
        price_per_sqft
        asking_price
        changes_applied
        mls_data
      }
    }
  }
}`;

const needed_data = ['photos'];
export async function GET(request: Request) {
  const { token, guid } = getTokenAndGuidFromSessionKey(request.headers.get('authorization') || '');
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  const url = new URL(request.url);
  const mls_id = url.searchParams.get('mls_id');
  const results = await axios.post(
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
  if (results?.data?.data?.properties?.data?.length) {
    const [record] = results?.data.data.properties.data;
    const { mls_data, ...property } = record.attributes;
    let output = {
      id: Number(record.id),
    };
    Object.keys(property).forEach(key => {
      if (property[key]) {
        output = {
          ...output,
          [key]: property[key],
        };
      }
    });
    mls_data &&
      Object.keys(mls_data).forEach(key => {
        if (mls_data[key] && needed_data.includes(key)) {
          output = {
            ...output,
            [key]: mls_data[key],
          };
        }
      });

    return getResponse(
      {
        id: record.id,
        property: output,
      },
      200,
    );
  }
  return getResponse(results?.data || {}, 200);

  const user = await getNewSessionKey(token, guid);
  let message = 'Unable to retrieve saved homes';
  if (user) {
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
  } else {
    message = `${message}\nNo valid user session`;
  }

  return new Response(
    JSON.stringify(
      {
        session_key: user?.session_key,
        message,
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

  if (agent && mls_id) {
    const user = await getNewSessionKey(token, guid);

    if (user && user.session_key) {
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

        return getResponse(
          {
            session_key: user.session_key,
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
          session_key: user.session_key,
          message: 'Unable to save home',
        },
        400,
      );
    }
  }

  return getResponse(
    {
      error: 'Please log in',
    },
    401,
  );
}
