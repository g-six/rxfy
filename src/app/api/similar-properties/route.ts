import { AxiosError } from 'axios';
import { getResponse } from '../response-helper';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { getCombinedData } from '@/_utilities/data-helpers/listings-helper';
import { getLatLonRange } from '@/_helpers/geocoding';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';

export async function GET(request: Request) {
  const listings: (PropertyDataModel & { photos: string[] })[] = [];
  const url = new URL(request.url);
  const property_type = url.searchParams.get('property_type') as string;
  const lat = url.searchParams.get('lat') as string;
  const lng = url.searchParams.get('lon') as string;
  const mls_id = url.searchParams.get('mls') as string;
  const beds = url.searchParams.get('beds') as string;
  const { lat_min, lat_max, lon_min, lon_max } = getLatLonRange(Number(lat), Number(lng), 5);

  const legacy_result = await retrieveFromLegacyPipeline({
    query: {
      bool: {
        filter: [
          {
            range: {
              'data.lat': {
                gte: lat_min,
                lte: lat_max,
              },
            },
          },
          {
            range: {
              'data.lng': {
                gte: lon_min,
                lte: lon_max,
              },
            },
          },
          { match: { 'data.Status': 'active' } },
        ],
        should: [
          { match: { 'data.PropertyType': decodeURIComponent(property_type) } },
          {
            range: {
              'data.L_BedroomTotal': {
                gte: Number(beds) > 3 ? Number(beds) - 1 : Number(beds),
                lte: Number(beds) > 3 ? Number(beds) + 2 : undefined,
              },
            },
          },
        ],
        must_not: [{ match: { 'data.MLS_ID': mls_id } }],
      },
    },
    size: 3,
    from: 0,
  }).catch(e => {
    const err = e as AxiosError;
    console.log('error');
    console.log(err.response?.data);
  });
  if (legacy_result && legacy_result.length) {
    legacy_result.map((hit: PropertyDataModel) => {
      if (hit) {
        listings.push({
          ...hit,
          photos: hit.photos && Array.isArray(hit.photos) ? hit.photos.map(p => getImageSized(p, 480)) : [],
        });
      }
    });
  }
  return getResponse({ listings }, 200);
}
