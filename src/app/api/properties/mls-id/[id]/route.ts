import { GQ_FRAGMENT_PROPERTY_ATTRIBUTES, MLSProperty } from '@/_typings/property';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { getFormattedPlaceDetails, googlePlaceQuery } from '@/app/api/_helpers/geo-helper';
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
  const url = new URL(request.url);
  let mls_id = url.pathname.split('/').pop() || '';
  const json_file = `https://pages.leagent.com/listings/${mls_id}/recent.json`;
  let address = '';
  let zip = '';
  try {
    await axios.get(`${process.env.NEXT_PUBLIC_API}/strapi/property/${mls_id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const [legacy] = await retrieveFromLegacyPipeline(
      {
        from: 0,
        size: 1,
        sort: { 'data.ListingDate': 'desc' },
        query: {
          bool: {
            filter: [
              {
                match: {
                  'data.MLS_ID': mls_id,
                },
              },
            ],
            should: [],
          },
        },
      },
      undefined,
      2,
    );

    if (legacy && isNaN(Number(legacy.lat))) {
      // No lat,lon - extra processing
      const [place] = await googlePlaceQuery(`${legacy.title} ${legacy.postal_zip_code}`);
      if (place && place.place_id) {
        const details = await getFormattedPlaceDetails(place.place_id);
        const { mls_data, ...property } = legacy;
        const { ListingID: listing_id } = mls_data as MLSProperty;
        return getResponse({
          ...property,
          ...details,
          listing_id,
        });
      }
      // return getResponse({ place });
    }

    const cache = await axios.get(json_file);
    return getResponse(cache.data, 200);
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

      console.log(`From integrations: ${process.env.NEXT_PUBLIC_API}/strapi/property/${mls_id}`);
      console.log(xhr.data);

      if (xhr.data?.data?.attributes) {
        const cache = await axios.get(json_file);
        return getResponse(cache.data, 200);
      }
    }
    console.log('properties.mls-id.GET axerr error');
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
  return getResponse(
    {
      api: 'properties.mls-id.GET',
      message: `MLS ID: ${mls_id} not found`,
    },
    400,
  );
}
