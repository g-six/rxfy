import { AxiosError } from 'axios';
import { getResponse } from '../response-helper';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

import { PropertyDataModel } from '@/_typings/property';
import { getLatLonRange } from '@/_helpers/geocoding';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { getPropertyByMlsId } from '../properties/model';

export async function GET(request: Request) {
  const listings: (PropertyDataModel & { photos: string[] })[] = [];
  const url = new URL(request.url);
  const property_type = url.searchParams.get('property_type') as string;
  const lat = url.searchParams.get('lat') as string;
  const lng = url.searchParams.get('lon') as string;
  const mls_id = url.searchParams.get('mls') as string;
  const beds = url.searchParams.get('beds') as string;
  const postal_zip_code = url.searchParams.get('postal_zip_code') as string;
  const { lat_min, lat_max, lon_min, lon_max } = getLatLonRange(Number(lat), Number(lng), 5);
  const should: { [k: string]: unknown }[] = [
    { match: { 'data.PropertyType': decodeURIComponent(property_type) } },
    {
      range: {
        'data.L_BedroomTotal': {
          gte: Number(beds) > 3 ? Number(beds) - 1 : Number(beds),
          lte: Number(beds) > 3 ? Number(beds) + 2 : undefined,
        },
      },
    },
  ];
  // if (postal_zip_code) {
  //   should.push({ match: { 'data.PostalZip_Code': decodeURIComponent(postal_zip_code) } });
  // }
  console.log(JSON.stringify({ should }, null, 4));
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
        should,
        minimum_should_match: should.length - 1,
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
    const promises = await Promise.all(
      legacy_result.map(async (hit: PropertyDataModel) => {
        if (hit) {
          return getPropertyByMlsId(hit.mls_id, {
            photos: hit.photos as string[],
          });
        }
      }),
    );
    promises
      .filter(result => result)
      .forEach(result => {
        const record = result as PropertyDataModel;
        let photos = record.photos || [];
        listings.push({
          ...record,
          photos,
        });
      });
  }
  return getResponse({ listings }, 200);
}
