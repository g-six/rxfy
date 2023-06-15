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
  console.log('');
  console.log('[GET] /api/properties/mls-id/[id]/route.ts');
  try {
    const json_file = `https://pages.leagent.com/listings/${mls_id}/recent.json`;
    console.log('  Retrieve:', json_file);

    const cache = await axios.get(json_file);
    const { mls_data, ...property } = cache.data;
    console.log('  Cache for legacy data found', mls_data.guid);
    console.log('');
    return getResponse(property, 200);
  } catch (e) {
    console.log('No JSON cache for', mls_id);
  }

  try {
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

    if (legacy) {
      const { mls_data, ...property } = legacy;
      const { ListingID: listing_id } = mls_data as MLSProperty;
      let details: { [key: string]: unknown } = {
        listing_id,
      };
      if (isNaN(Number(legacy.lat)) && legacy.title && legacy.postal_zip_code) {
        // No lat,lon - extra processing
        const [place] = await googlePlaceQuery(`${legacy.title} ${legacy.postal_zip_code}`);
        if (place && place.place_id) {
          details = await getFormattedPlaceDetails(place.place_id);

          details = {
            ...details,
            listing_id,
          };
        }
      }
      return getResponse({
        ...property,
        ...details,
      });
    }
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
      console.log(xhr.data?.data);
    }

    if (axerr.response?.data) {
      console.log(JSON.stringify(axerr.response?.data, null, 4));
    } else {
      console.log(axerr.response);
    }
    console.error(axerr);
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
