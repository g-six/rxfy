import { PROPERTY_ASSOCIATION_KEYS, PropertyDataModel } from '@/_typings/property';
import { MLS_FIELDS_SKIPPED, STRAPI_FIELDS } from '@/_utilities/api-calls/call-legacy-search';
import { formatAddress } from '@/_utilities/string-helper';
import { getPropertyAttributes } from '../property-attributes/model';
import axios from 'axios';
import { consoler } from '@/_helpers/consoler';
import {
  BUILD_RELATED_FIELDS,
  LegacyPipelineFields,
  PROPERTY_CONSTRUCTION_STATS,
  PROPERTY_FINANCIAL_STATS,
  PROPERTY_INFORMATION_STATS,
  WATER_SUPPLY_RELATED_FIELDS,
} from '../properties/types';
import { getPropertyByMlsId, updatePublicListingBy } from '../properties/model';
import { formatValues } from '@/_utilities/data-helpers/property-page';
const FILE = 'pipeline/subroutine.ts';
export async function getPipelineData(payload: { [k: string]: any }) {
  let pipeline_params = payload;
  if (payload.search_for === 'RECENTLY_SOLD') {
    let date = new Date().toISOString().split('T').reverse().pop();
    let closing_date = {
      lte: date + 'T23:59:59',
      gte: date + 'T00:00:00',
    };
    if (payload.date) date = payload.date;
    if (payload.from) closing_date.gte = payload.from + 'T00:00:00';
    if (payload.to) closing_date.lte = payload.from + 'T23:59:59';

    pipeline_params = {
      size: Number(payload.size || 1),
      sort: {
        'data.ListingDate': 'desc',
      },
      query: {
        ...payload.query,
        exists: undefined,
        bool: {
          ...(payload.query?.bool || {}),
          filter: [
            {
              range: {
                'data.ClosingDate': closing_date,
              },
            },
          ],
          must: [
            {
              exists: {
                field: 'data.ClosingDate',
              },
            },
            {
              exists: {
                field: 'data.SoldPrice',
              },
            },
          ],
          must_not: [
            { match: { 'data.IdxInclude': 'no' } },
            { match: { 'data.L_Class': 'Rental' } },
            { match: { 'data.L_Class': 'Commercial Lease' } },
            { match: { 'data.L_Class': 'Commercial Sale' } },
          ],
        },
      },
    };
  }

  const proms = await Promise.all([
    axios.post(process.env.NEXT_APP_LEGACY_PIPELINE_URL as string, pipeline_params, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    }),
    getPropertyAttributes(),
  ]);
  const {
    data: {
      hits: { hits },
    },
  } = proms[0];
  const { real_estate_board } = proms[1] as unknown as {
    real_estate_board: { name: string; id: number }[];
  };

  return { hits, real_estate_board, records: mapData(hits, real_estate_board) };
}

export function mapData(hits: { _source: { data: Record<string, unknown> } }[], real_estate_board?: { name: string }[]): PropertyDataModel[] {
  const skips: string[] = [];
  const listings = hits.map(p => {
    const {
      _source: { data },
    } = p;
    let hit: Record<string, unknown> = {};
    let data_groups: {
      [k: string]: {
        label: string;
        value?: string;
        icon?: string;
      }[];
    } = {};
    const hit_data_groups = hit as {
      data_groups: {
        [k: string]: {
          label: string;
          value: string;
          icon: string;
        }[];
      };
    };
    if (hit_data_groups.data_groups) {
      data_groups = hit_data_groups.data_groups;
    } else {
      data_groups = {};
    }

    Object.keys(data).forEach(k => {
      if (data[k] && `${data[k]}` !== 'None')
        if (k === 'photos') {
          hit = {
            ...hit,
            [k]: data[k],
            cover_photo: Array.isArray(data.photos) ? data.photos[0] : data.photos,
          };
        } else if (real_estate_board && real_estate_board.map(r => r.name).includes(data[k] as string)) {
          hit = {
            ...hit,
            real_estate_board: data[k],
          };
        } else if (STRAPI_FIELDS[k]) {
          if (PROPERTY_ASSOCIATION_KEYS.includes(STRAPI_FIELDS[k])) {
            // Logic for icons
            if (!data_groups?.features) {
              data_groups.features = [];
            }
            getPropertyFeatures(data[k] as string[]).map(k => {
              const feature = getPropertyIconAndTitle(k);
              if (data_groups.features.filter(({ icon }) => icon === feature.icon).length === 0) {
                data_groups.features.push(feature);
              }
            });

            hit.data_groups = data_groups;

            // End logic for icons

            hit = {
              ...hit,
              [STRAPI_FIELDS[k]]: getPropertyFeatures(data[k] as string[]),
            };
          } else if (STRAPI_FIELDS[k] === 'pets_allowed' && `${data[k]}`.toLowerCase() === 'yes') {
            let { pets_allowed = [] } = hit as {
              pets_allowed: { name: string }[];
            };
            if (k.toLowerCase().includes('cat')) pets_allowed.push({ name: 'Cat' });
            if (k.toLowerCase().includes('dog')) pets_allowed.push({ name: 'Dog' });
            hit = {
              ...hit,
              pets_allowed,
            };
          } else if (k.includes('Hectares')) {
            const hectares = Number(data[k]);
            if (!isNaN(hectares) && !hit[STRAPI_FIELDS[k]])
              hit = {
                ...hit,
                [STRAPI_FIELDS[k]]: hectares * 107639,
              };
          } else if (k.includes('Acres')) {
            const acres = Number(data[k]);
            if (!isNaN(acres) && !hit[STRAPI_FIELDS[k]])
              hit = {
                ...hit,
                [STRAPI_FIELDS[k]]: acres * 43560,
              };
          } else {
            let v = data[k];
            if (v) {
              if (Array.isArray(v)) {
                if (WATER_SUPPLY_RELATED_FIELDS.includes(k as unknown as LegacyPipelineFields)) {
                  v = v.map(text => text.replace(/supply/g, '').replace(/water/g, '') + ' Supplied Water');
                } else if (BUILD_RELATED_FIELDS.includes(k as unknown as LegacyPipelineFields)) {
                  v = v.map(text => text.replace(/supply/g, '').replace(/water/g, '') + ' Supplied Water');
                }
                if (hit[STRAPI_FIELDS[k]]) {
                  v = (hit[STRAPI_FIELDS[k]] as string[]).concat(v as string[]);
                }
              } else {
                v = isNaN(Number(data[k])) ? data[k] : Number(data[k]);
              }
              if (!data_groups?.property_information || !data_groups?.financial_information || !data_groups?.construction) {
                // Logic for property_information
                if (!data_groups?.property_information) {
                  data_groups.property_information = [];
                }
                if (!data_groups?.financial_information) {
                  data_groups.financial_information = [];
                }
                if (!data_groups?.construction) {
                  data_groups.construction = [];
                }
              }

              if (data_groups.property_information.length === 0 || data_groups.financial_information.length === 0 || data_groups.construction.length === 0) {
                let label = '';
                let group = '';
                const strapi_field = STRAPI_FIELDS[k];
                if (Object.keys(PROPERTY_INFORMATION_STATS).includes(strapi_field)) {
                  group = 'property_information';
                  label = PROPERTY_INFORMATION_STATS[strapi_field] as string;
                }
                if (Object.keys(PROPERTY_FINANCIAL_STATS).includes(strapi_field)) {
                  group = 'financial_information';
                  label = PROPERTY_FINANCIAL_STATS[strapi_field] as string;
                }
                if (Object.keys(PROPERTY_CONSTRUCTION_STATS).includes(strapi_field)) {
                  group = 'construction';
                  label = PROPERTY_CONSTRUCTION_STATS[strapi_field] as string;
                }

                if (v && group && label) {
                  data_groups[group].push({
                    label,
                    value: `${Array.isArray(v) ? (v as string[]).join(' • ') : v}`,
                  });
                }

                hit.data_groups = data_groups;
              }
              hit = {
                ...hit,
                [STRAPI_FIELDS[k]]: v,
              };
            }
          }
        } else if (data[k] && (!isNaN(Number(data[k])) ? Number(data[k]) : true)) {
          // Skip these
          if (!k.includes('L_Room') && !k.includes('L_Bath') && !MLS_FIELDS_SKIPPED.includes(k)) {
            skips.push(k);

            // Enable to investigate significance of board fields
            // if (k === 'ListAgent2') consoler(FILE, k + ' has not been strapified but has a value of:', data[k]);
          }
        }
    });
    if (!hit_data_groups.data_groups && Object.keys(data_groups).length && hit.mls_id) {
      updatePublicListingBy({ mls_id: hit.mls_id as string }, { data_groups })
        .then(console.log)
        .catch(console.error);
    }
    // Debug fields not strapified
    // skips.length > 0 && consoler(FILE, { new_fields: skips });

    const listing_by = `Listing courtesy of ${
      data.LA1_FullName ||
      data.LA2_FullName ||
      data.LA3_FullName ||
      data.SO1_FullName ||
      data.SO2_FullName ||
      data.SO3_FullName ||
      data.LO1_Name ||
      data.LO2_Name ||
      data.LO3_Name ||
      'Leagent'
    }`;
    return {
      ...hit,
      title: `${hit.title}`
        .split(',')
        .map((s, idx) => (idx === 0 ? formatAddress(s) : s))
        .join(','),
      listing_by,
    };
  }) as PropertyDataModel[];
  return listings;
}

export async function getListingHistory({
  address,
  state_province,
  postal_zip_code,
}: {
  address?: string;
  state_province?: string;
  postal_zip_code?: string;
}): Promise<PropertyDataModel[]> {
  if (!address || !state_province || !postal_zip_code) return [];

  const pipeline_params = {
    from: 0,
    size: 5,
    query: {
      bool: {
        filter: [
          {
            match_phrase: {
              'data.Address': address,
            },
          },
          {
            match_phrase: {
              'data.Province_State': state_province,
            },
          },
          {
            match_phrase: {
              'data.PostalCode_Zip': postal_zip_code,
            },
          },
          {
            match: {
              'data.Status': 'Sold',
            },
          },
        ],
      },
    },
  };

  const { hits } = await getPipelineData(pipeline_params);
  return hits ? mapData(hits) : [];
}

export async function getBuildingUnits({
  mls_id,
  complex_compound_name,
  state_province,
  postal_zip_code,
}: {
  mls_id: string;
  complex_compound_name?: string;
  state_province?: string;
  postal_zip_code?: string;
}): Promise<PropertyDataModel[]> {
  if (!complex_compound_name || !state_province || !postal_zip_code) return [];

  const pipeline_params = {
    from: 0,
    size: 100,
    query: {
      bool: {
        should: [
          {
            match_phrase: {
              'data.L_ComplexName': complex_compound_name,
            },
          },
          {
            match_phrase: {
              'data.L_SubareaCommunity': complex_compound_name,
            },
          },
        ],
        minimum_should_match: 1,
        must_not: [{ match: { 'data.MLS_ID': mls_id } }],
        must: [
          {
            match_phrase: {
              'data.Province_State': state_province,
            },
          },
          {
            match_phrase: {
              'data.PostalCode_Zip': postal_zip_code,
            },
          },
          {
            match: {
              'data.Status': 'Active',
            },
          },
        ],
      },
    },
  };

  const { hits } = await getPipelineData(pipeline_params);
  return hits ? mapData(hits) : [];
}

function getPropertyFeatures(keys: string[]): string[] {
  const concatenated_values = keys.map(k => k.split(',')).join('/');
  return concatenated_values.split('/');
}

export function getPropertyIconAndTitle(key: string) {
  const ICONS_DIRECTORY = '/icons/features/';
  switch (key) {
    case 'DW':
      return {
        label: 'Dish Washer',
        // value: key,
        icon: ICONS_DIRECTORY + 'feature_dish-washer.svg',
      };
    case 'Microwave':
      return {
        label: key,
        // value: key,
        icon: ICONS_DIRECTORY + 'feature_microwave.svg',
      };
    case 'Stve':
      return {
        label: 'Stove',
        // value: key,
        icon: ICONS_DIRECTORY + 'feature_cooking-station.svg',
      };
    case 'Dryr':
    case 'ClthWsh':
      return {
        label: 'Washing Machine',
        // value: key,
        icon: ICONS_DIRECTORY + 'feature_laundry.svg',
      };
    case 'Window Coverings':
    case 'Drapes':
      return {
        label: key,
        // value: key,
        icon: ICONS_DIRECTORY + 'feature_window-coverings.svg',
      };
    case 'Sprinkler - Fire':
      return {
        label: key,
        // value: key,
        icon: ICONS_DIRECTORY + 'feature_fire-alarm.svg',
      };
    case 'Frdg':
      return {
        label: 'Refrigerator',
        // value: key,
        icon: ICONS_DIRECTORY + 'feature_refrigerator.svg',
      };
    case 'City':
    case 'Municipal':
      return {
        label: 'Municipal / City Supplied Water',
        // value: key,
        icon: ICONS_DIRECTORY + 'feature_city-municipal.svg',
      };
    case 'Air Cond.':
    case 'Air Conditioning':
      return {
        label: 'A/C',
        // value: key,
        icon: ICONS_DIRECTORY + 'feature_air-conditioner.svg',
      };
    default:
      return {
        label: key,
        // value: key,
        icon: ICONS_DIRECTORY + `feature_${key.split(' ').join('-').toLowerCase().split('---').join('-')}.svg`,
      };
  }
}
