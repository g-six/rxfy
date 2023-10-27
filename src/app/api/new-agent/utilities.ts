import { SearchHighlightInput } from '@/_typings/maps';
import axios from 'axios';

export async function getSampleListings(agent_id: string, target_city: SearchHighlightInput, size = 1) {
  console.log('Retrieving sample listing', { agent_id, target_city, size });
  return axios.post(
    process.env.NEXT_APP_LEGACY_PIPELINE_URL as string,
    {
      from: 0,
      size,
      sort: { 'data.ListingDate': 'desc' },
      query: {
        bool: {
          filter: [
            {
              range: {
                'data.lat': {
                  gt: target_city.swlat,
                  lt: target_city.nelat,
                },
              },
            },
            {
              range: {
                'data.lng': {
                  gt: target_city.swlng,
                  lt: target_city.nelng,
                },
              },
            },
            {
              exists: {
                field: 'data.photos',
              },
            },
          ],
          should: [
            {
              match: { 'data.LA1_LoginName': agent_id },
            },
            {
              match: { 'data.LA2_LoginName': agent_id },
            },
            {
              match: { 'data.LA3_LoginName': agent_id },
            },
          ],
          must_not: [
            { match: { 'data.IdxInclude': 'no' } },
            { match: { 'data.L_Class': 'Rental' } },
            { match: { 'data.L_Class': 'Commercial Lease' } },
            { match: { 'data.L_Class': 'Commercial Sale' } },
            {
              match: {
                'data.Status': 'Terminated',
              },
            },
          ],
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
}
