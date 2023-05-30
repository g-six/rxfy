import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES } from '@/_typings/property';
import { getResponse } from '@/app/api/response-helper';
import axios, { AxiosError } from 'axios';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const gql_find_home = `query FindHomeByMLSID($mls_id: String!) {
    properties(filters:{ mls_id:{ eq: $mls_id}}, pagination: {limit:1}) {
      data {
        id
        attributes {${GQ_FRAGMENT_PROPERTY_ATTRIBUTES}}
      }
    }
  }`;

export async function GET(request: Request) {
  let mls_id = '';
  try {
    const url = new URL(request.url);
    mls_id = url.pathname.split('/').pop() || '';
    let results = await axios.post(
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
    let property: any;

    const cache_property = await axios.get(`https://pages.leagent.com/listings/${mls_id}/recent.json`);

    return getResponse(cache_property.data || {}, 200);
  } catch (e) {
    const axerr = e as AxiosError;
    if (axerr.response?.status === 403) {
      // Might not have cache yet, attempt to create
      console.log('Might not have cache yet, attempt to create');
      const xhr = await axios.get(`${process.env.NEXT_PUBLIC_API}/strapi/property/${mls_id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (xhr.data?.data?.attributes) {
        const { id, attributes } = xhr.data.data;
        return getResponse({
          ...attributes,
          id,
        });
      }
    }
    console.log('properties.GET axerr error');
    if (axerr.response?.data) {
      console.log(JSON.stringify(axerr.response?.data, null, 4));
    } else {
      console.log(axerr.response);
    }
    console.log('end properties.GET  axerr error');
    return getResponse(
      {
        api: 'properties.mls-id.GET',
        message: axerr.message,
        code: axerr.code,
      },
      400,
    );
  }
}
