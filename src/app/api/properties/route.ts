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
}
