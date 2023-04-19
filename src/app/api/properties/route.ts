import axios from 'axios';
import { MLSProperty } from '@/_typings/property';
import { getResponse } from '../response-helper';
import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getNewSessionKey } from '../update-session';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
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
    let output: {
      [key: string]: string | number | boolean;
    } = {
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
        if (mls_data[key]) {
          switch (key) {
            case 'photos':
              if (mls_data[key].length > 0) {
                const photos = mls_data[key] as string[];
                output = {
                  ...output,
                  thumbnail: `https://e52tn40a.cdn.imgeng.in/w_720/${photos[0]}`,
                };
              }
              break;
            case 'Address':
            case 'Status':
            case 'Remarks':
              output = {
                ...output,
                [key.toLowerCase()]: capitalizeFirstLetter(mls_data[key].toLowerCase()),
              };
              break;
            case 'L_PublicRemakrs':
              output = {
                ...output,
                description: capitalizeFirstLetter(mls_data[key].toLowerCase()),
              };
              break;
            case 'L_TotalBaths':
              output = {
                ...output,
                baths: Number(mls_data[key]),
              };
              break;
            case 'B_Style':
              output = {
                ...output,
                style: Number(mls_data[key]),
              };
              break;
            case 'LandTitle':
              output = {
                ...output,
                land_title: Number(mls_data[key]),
              };
              break;
            default:
              output = {
                ...output,
                [key]: mls_data[key],
              };
              console.log(key);
              break;
          }
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
