import { NextRequest } from 'next/server';
import axios from 'axios';
import { getResponse } from '../response-helper';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};

const QRY_DWELLING_TYPES = `query DwellingTypes {
    types: dwellingTypes(pagination: { limit: 100 }) {
      records: data {
        id
        attributes {
          name
        }
      }
    }
}
`;

export async function GET(request: NextRequest) {
  const api_url = `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`;
  if (api_url) {
    const gql_params: {
      query: string;
      variables?: {
        [key: string]: string;
      };
    } = {
      query: QRY_DWELLING_TYPES,
    };
    const leagent_cms_res = await axios.post(api_url, gql_params, { headers });

    let response = {};
    if (leagent_cms_res.data.data) {
      Object.keys(leagent_cms_res.data.data).forEach(relationship => {
        const existing: { [key: string]: any }[] = [];

        leagent_cms_res.data.data[relationship].records.forEach((record: { id: number; attributes: { name: string } }) => {
          existing.push({
            ...record.attributes,
            id: Number(record.id),
          });
        });

        response = {
          ...response,
          [relationship]: existing,
        };
      });
    }

    return getResponse(response, 200);
  }
  return getResponse({}, 201);
}
