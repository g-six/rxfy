import axios, { AxiosError } from 'axios';
import { getResponse } from '../response-helper';

import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, MLSProperty } from '@/_typings/property';
import { NextRequest } from 'next/server';
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

export async function GET(request: NextRequest) {
  try {
    if (request && request.url) return getResponse({}, 201);
    const url = new URL(request.url);
    const mls_id = url.searchParams.get('mls_id') as string;
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
    console.log('properties.GET axerr error');
    if (axerr.response?.data) {
      console.log(JSON.stringify(axerr.response?.data, null, 4));
    } else {
      console.log('axerr.response', axerr);
    }
    console.log('end properties.GET  axerr error');
    return getResponse(
      {
        api: 'properties.GET',
        message: axerr.message,
        code: axerr.code,
      },
      400,
    );
  }
}

async function getNeighboursAndHistory(
  property_type: string,
  address_number: string,
  address_street: string,
  address: string,
  postal_zip_code: string,
  province_state: string,
) {
  console.log('getNeighboursAndHistory for units in the building', `${address_number} ${address_street}`);
  const {
    data: {
      hits: { hits },
    },
  } = await axios.post(
    process.env.NEXT_APP_LEGACY_PIPELINE_URL as string,
    {
      query: {
        bool: {
          filter: [{ match: { 'data.PropertyType': property_type } }],
          should: [
            { match: { 'data.AddressNumber': address_number } },
            { match: { 'data.AddressStreet': address_street } },
            {
              match: {
                'data.PostalCode_Zip': postal_zip_code,
              },
            },
            {
              match: {
                'data.Province_State': province_state,
              },
            },
          ],
          minimum_should_match: 3,
        },
      },
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const neighbours: MLSProperty[] = [];
  const sold_history: MLSProperty[] = [];
  hits.forEach(({ _source }: { _source: unknown }) => {
    const { data: hit } = _source as {
      data: Record<string, unknown>;
    };
    let property = {
      Address: '',
      Status: '',
    };
    Object.keys(hit as Record<string, unknown>).forEach(key => {
      if (hit[key] && key !== 'id') {
        property = {
          ...property,
          [key]: hit[key],
        };
      }
    });
    if (property.Status === 'Sold' && property.Address === address) sold_history.push(property as MLSProperty);
    else if (property.Status === 'Active') neighbours.push(property as MLSProperty);
  });

  return {
    sold_history,
    neighbours,
  };
}
