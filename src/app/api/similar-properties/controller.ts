import { getLatLonRange } from '@/_helpers/geocoding';
import { PropertyDataModel } from '@/_typings/property';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { formatAddress } from '@/_utilities/string-helper';
import { AxiosError } from 'axios';

export async function getSimilarMLSListings(p: {
  asking_price?: number;
  lat?: number;
  lng?: number;
  beds?: number;
  mls_id?: string;
  area?: string;
  city: string;
  state_province: string;
  property_type: string;
}) {
  const { asking_price, area, beds, city, state_province, mls_id, property_type } = p;

  //   const { lat_min, lat_max, lon_min, lon_max } = getLatLonRange(Number(lat), Number(lng), 5);
  const should: { [k: string]: unknown }[] = [
    { match: { 'data.PropertyType': decodeURIComponent(property_type) } },
    {
      range: {
        'data.L_BedroomTotal': {
          gte: Number(beds) > 3 ? Number(beds) - 1 : Number(beds),
          // lte: Number(beds) > 3 ? Number(beds) + 2 : undefined,
        },
      },
    },
  ];

  const must_not: { match: { [k: string]: string } }[] = mls_id
    ? [{ match: { 'data.MLS_ID': mls_id } }, { match: { 'data.L_SaleRent': 'For Rent' } }]
    : [{ match: { 'data.L_SaleRent': 'For Rent' } }];

  const filter: { match?: { [k: string]: string }; range?: { [k: string]: { gte?: number; lte?: number } } }[] = [
    { match: { 'data.Province_State': state_province } },
    { match: { 'data.City': city } },
    { match: { 'data.Status': 'active' } },
  ];

  if (area) {
    filter.push({ match: { 'data.Area': area } });
  }

  if (asking_price) {
    filter.push({
      range: {
        'data.AskingPrice': {
          gte: asking_price - 200000,
          lte: asking_price + 300000,
        },
      },
    });
  }

  const legacy_result = await retrieveFromLegacyPipeline({
    size: 3,
    from: 0,
    sort: { 'data.ListingDate': 'desc' },
    query: {
      bool: {
        filter,
        should,
        minimum_should_match: should.length > 1 ? should.length - 1 : should.length,
        must_not,
        must: [
          {
            exists: {
              field: 'data.photos',
            },
          },
        ],
      },
    },
  }).catch(e => {
    const err = e as AxiosError;
    console.log('error');
    console.log(err.response?.data);
  });

  return (legacy_result || []).map(l => ({
    ...l,
    title: formatAddress(l.title),
  }));
}
