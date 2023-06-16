import { MLSProperty } from '@/_typings/property';
import { RealEstateBoardDataModel } from '@/_typings/real-estate-board';
import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { createAgentRecordIfNoneFound } from '@/app/api/agents/model';
import { getFormattedPlaceDetails, googlePlaceQuery } from '../_helpers/geo-helper';
import axios, { AxiosError } from 'axios';
import { createCacheItem, invalidateCache } from '../_helpers/cache-helper';
import { getRealEstateBoard } from '../real-estate-boards/model';

export async function createAgentsFromProperty(p: MLSProperty, real_estate_board: RealEstateBoardDataModel) {
  const agents: number[] = [];
  try {
    for await (const num of [1, 2, 3]) {
      const agent_id = p[`LA${num}_LoginName`] as string;
      const email = p[`LA${num}_Email`] as string;
      let full_name = p[`LA${num}_FullName`] as string;
      if (full_name) {
        full_name = full_name.split(' PREC').join('').split('*').join('');
        const phone = p[`LA${num}_PhoneNumber1`] as string;

        if (agent_id && email && full_name) {
          const agent = await createAgentRecordIfNoneFound(
            {
              agent_id,
              email,
              phone,
              full_name,
            },
            real_estate_board,
            {
              lat: p.lat,
              lng: p.lng,
              target_area: p.Area,
              target_city: p.City,
              asking_price: p.AskingPrice,
              listing_date: `${p.ListingDate.substring(0, 10).split('-').map(Number).reverse().join('/')}`,
              property_type: `${p.PropertyType}`.trim(),
              beds: p.L_BedroomTotal,
              baths: p.L_TotalBaths,
              description: p.L_PublicRemakrs,
            },
          );
          agents.push(agent.id);
        }
      }
    }
  } catch (e) {
    console.log('Caught error in createAgentsFromProperty');
    console.log(e);
  }

  return agents;
}

export async function buildCacheFiles(mls_id: string) {
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
      const real_estate_board = await getRealEstateBoard(mls_data as unknown as { [key: string]: string });
      let details: { [key: string]: unknown } = {
        listing_id,
        real_estate_board,
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
      axios.get(`${process.env.NEXT_PUBLIC_API}/strapi/property/${mls_id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const file = `listings/${mls_id}`;
      const recent_json = JSON.stringify(
        {
          ...property,
          ...details,
        },
        null,
        4,
      );
      invalidateCache([`/${file}/recent.json`, `/${file}/legacy.json`]);
      createCacheItem(recent_json, `${file}/recent.json`, 'text/json');
      createCacheItem(JSON.stringify(mls_data, null, 4), `${file}/legacy.json`, 'text/json');
      return {
        ...property,
        ...details,
      };
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
    }

    if (!axerr.response?.data) {
      console.log('[ERROR] api/properties/model.buildCacheFiles', axerr.response);
    }

    return {
      api: 'properties.mls-id.GET',
      message: axerr.message,
      code: axerr.code,
    };
  }
}
