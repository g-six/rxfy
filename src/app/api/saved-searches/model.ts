import { SavedSearchInput, SavedSearchOutput } from '@/_typings/saved-search';
import axios from 'axios';
import { gql_to_notify, gql_my_saved_searches, gql_update_search, gql_delete_search } from './gql';
import { SavedSearchGraph } from './data-types';
import { getPipelineData } from '../pipeline/subroutines';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { consoler } from '@/_helpers/consoler';
import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { findAgentRecordByAgentId } from '../agents/model';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

const headers = {
  Authorization: `Bearer ${process.env.NEXT_APP_CMS_API_KEY as string}`,
  'Content-Type': 'application/json',
};
const FILE = 'saved-searches/model.ts';

export async function removeSavedSearch(id: number) {
  return await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_delete_search,
      variables: {
        id,
      },
    },
    {
      headers,
    },
  );
}

export async function updateSavedSearch(id: number, updates: SavedSearchInput) {
  return await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_update_search,
      variables: {
        id,
        updates,
      },
    },
    {
      headers,
    },
  );
}

export async function createSavedSearch(agent: number, search_params: SavedSearchInput, customer: number) {
  let params = {};
  Object.keys(search_params).forEach(k => {
    if (!['place_id', 'center'].includes(k)) {
      const kv = search_params as unknown as { [key: string]: unknown };
      params = {
        ...params,
        [k]: kv[k],
      };
    }
  });

  const { data: search_response } = await axios.post(
    `${process.env.NEXT_APP_CMS_GRAPHQL_URL}`,
    {
      query: gql_create_saved_search,
      variables: {
        data: {
          customer,
          ...params,
        },
      },
    },
    {
      headers,
    },
  );

  if (search_response.data?.createSavedSearch?.data?.id) {
    const { id, attributes } = search_response.data?.createSavedSearch?.data;
    return {
      ...attributes,
      id: Number(id),
    };
  } else if (search_response.errors) {
    console.log(search_response.errors);
  }
}

export async function getTopListings(
  { nelat, nelng, swlat, swlng, city, maxprice, maxsqft, minprice, minsqft, beds, baths }: SavedSearchInput,
  links?: {
    property_url?: string;
  },
) {
  const should: {
    match?: { [k: string]: string };
    range?: {
      [k: string]: {
        lte?: number;
        gte?: number;
      };
    };
  }[] = [];
  if (beds) {
    should.push({
      range: {
        'data.L_BedroomTotal': {
          gte: beds,
        },
      },
    });
  }
  if (baths) {
    should.push({
      range: {
        'data.L_TotalBaths': {
          gte: baths,
        },
      },
    });
  }
  if (maxsqft && minsqft) {
    should.push({
      range: {
        'data.L_FloorArea_Total': {
          lte: maxsqft,
          gte: minsqft,
        },
      },
    });
  } else if (maxsqft) {
    should.push({
      range: {
        'data.L_FloorArea_Total': {
          lte: maxsqft,
        },
      },
    });
  } else if (minsqft) {
    should.push({
      range: {
        'data.L_FloorArea_Total': {
          gte: minsqft,
        },
      },
    });
  }
  if (maxprice && minprice) {
    should.push({
      range: {
        'data.AskingPrice': {
          lte: maxprice,
          gte: minprice,
        },
      },
    });
  } else if (maxprice) {
    should.push({
      range: {
        'data.AskingPrice': {
          lte: maxprice,
        },
      },
    });
  } else if (minprice) {
    should.push({
      range: {
        'data.AskingPrice': {
          gte: minprice,
        },
      },
    });
  }

  if (nelat && nelng && swlat && swlng) {
    should.push({
      range: {
        'data.lat': {
          lte: nelat,
          gte: swlat,
        },
      },
    });
    should.push({
      range: {
        'data.lng': {
          lte: nelng,
          gte: swlng,
        },
      },
    });
  } else if (city) {
    should.push({
      match: {
        'data.City': city,
      },
    });
  }

  const internal_req = {
    from: 0,
    size: 6,
    sort: {
      'data.UpdateDate': 'desc',
    },
    query: {
      bool: {
        filter: [
          {
            match: {
              'data.Status': 'Active',
            },
          },
        ],
        should,
        minimum_should_match: should.length - 1,
        must_not: [
          {
            match: {
              'data.Status': 'Sold',
            },
          },
          {
            match: {
              'data.IdxInclude': 'No',
            },
          },
        ],
      },
    },
  } as LegacySearchPayload;
  const { hits } = await getPipelineData(internal_req);
  const records = hits.map(({ _source: { data } }: { _source: { data: MLSProperty } }) => {
    const property: { [k: string]: string | number } = {
      ...links,
      address: formatValues(data, 'Address') as string,
      asking_price: `$${new Intl.NumberFormat(undefined, {}).format(data.AskingPrice)}` as any,
      city: formatValues(data, 'City') as string,
      area: formatValues(data, 'Area') as string,
      year_built: data.L_YearBuilt || '',
      lat: data.lat,
      lon: data.lng,
      beds: data.L_BedroomTotal || 0,
      baths: data.L_TotalBaths || 0,
      floor_area: data.L_FloorArea_Total,
      mls_id: data.MLS_ID,
      cover_photo: data.photos && Array.isArray(data.photos) ? (data.photos.reverse().pop() as string) : '',
      featured_img: data.photos && Array.isArray(data.photos) ? getImageSized(data.photos.reverse().pop() as string, 480) : '',
    };
    return property;
  });

  return records;
}

export async function getNextFiveToEmail() {
  const xhr = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
    method: 'POST',
    body: JSON.stringify({
      query: gql_to_notify,
      variables: {
        last_email_at: new Date(Date.now() - 60000 * 60 * 24),
      },
    }),
    headers,
  });

  try {
    const json = await xhr.json();
    const {
      data: {
        new_items: { data: new_items },
        resend: { data: resend },
      },
    } = json as {
      data: {
        new_items: {
          data: SavedSearchGraph[];
        };
        resend: {
          data: SavedSearchGraph[];
        };
      };
    };
    return new_items
      .map(record => ({
        ...record.attributes,
        agent: record.attributes.agent_metatag?.data
          ? {
              ...record.attributes.agent_metatag.data.attributes,
              id: Number(record.attributes.agent_metatag.data.id),
            }
          : undefined,
        id: Number(record.id),
      }))
      .concat(
        resend.map(record => ({
          ...record.attributes,
          agent: record.attributes.agent_metatag?.data
            ? {
                ...record.attributes.agent_metatag.data.attributes,
                id: Number(record.attributes.agent_metatag.data.id),
              }
            : undefined,
          id: Number(record.id),
        })),
      ) as SavedSearchOutput[];
  } catch (e) {
    console.error('Error in api/saved-searches.model.retrieveSavedSearches');
    console.error(e);
    console.error('End of error in api/saved-searches.model.retrieveSavedSearches');
  }
  return [];
}

export async function retrieveSavedSearches(customer_id: number) {
  const xhr = await fetch(`${process.env.NEXT_APP_CMS_GRAPHQL_URL}`, {
    method: 'POST',
    body: JSON.stringify({
      query: gql_my_saved_searches,
      variables: {
        customer_id,
      },
    }),
    headers,
  });

  try {
    const json = await xhr.json();
    const {
      data: {
        savedSearches: { records },
      },
    } = json as {
      data: {
        savedSearches: {
          records: SavedSearchGraph[];
        };
      };
    };
    return records.map(record => ({
      ...record.attributes,
      id: Number(record.id),
    })) as SavedSearchOutput[];
  } catch (e) {
    console.error('Error in api/saved-searches.model.retrieveSavedSearches');
    console.error(e);
    console.error('End of error in api/saved-searches.model.retrieveSavedSearches');
  }
  return [];
}

export const gqf_saved_search_attributes = `
                search_url
                lat
                lng
                area
                beds
                baths
                city
                minprice
                maxprice
                nelat
                nelng
                swlat
                swlng
                zoom
                type
                sorting
                dwelling_types {
                  data {
                    id
                    attributes {
                      name
                      code
                    }
                  }
                }
                add_date
                year_built
                tags
                last_email_at
                is_active
                minsqft
                maxsqft`;

const gql_create_saved_search = `mutation CreateSavedSearch ($data: SavedSearchInput!) {
    createSavedSearch(data: $data) {
      data {
        id
        attributes {
          ${gqf_saved_search_attributes}
        }
      }
    }
  }`;
