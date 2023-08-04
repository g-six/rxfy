import axios, { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import { getResponse } from '../response-helper';
import { STRAPI_FIELDS } from '@/_utilities/api-calls/call-legacy-search';
import { GET as getPropertyAttributes } from '@/app/api/property-attributes/route';
import { formatAddress } from '@/_utilities/string-helper';
import { PropertyDataModel } from '@/_typings/property';
import { objectToQueryString } from '@/_utilities/url-helper';
import { createCacheItem } from '../_helpers/cache-helper';
import { LegacySearchPayload } from '@/_typings/pipeline';
function mapData(hits: { _source: { data: Record<string, unknown> } }[], real_estate_board?: { name: string }[]): PropertyDataModel[] {
  return hits.map(p => {
    const {
      _source: { data },
    } = p;
    let hit: Record<string, unknown> = {};
    Object.keys(data).forEach(k => {
      if (data[k] && `${data[k]}` !== 'None')
        if (k === 'photos') {
          hit = {
            ...hit,
            cover_photo: Array.isArray(data.photos) ? data.photos[0] : data.photos,
          };
        } else if (real_estate_board && real_estate_board.map(r => r.name).includes(data[k] as string)) {
          hit = {
            ...hit,
            real_estate_board: data[k],
          };
        } else if (STRAPI_FIELDS[k]) {
          const v = isNaN(Number(data[k])) ? data[k] : Number(data[k]);
          if (v) {
            hit = {
              ...hit,
              [STRAPI_FIELDS[k]]: v,
            };
          }
        }
    });
    const listing_by =
      data.LA1_FullName ||
      data.LA2_FullName ||
      data.LA3_FullName ||
      data.SO1_FullName ||
      data.SO2_FullName ||
      data.SO3_FullName ||
      data.LO1_Name ||
      data.LO2_Name ||
      data.LO3_Name ||
      'Leagent';
    return {
      ...hit,
      title: `${hit.title}`
        .split(',')
        .map((s, idx) => (idx === 0 ? formatAddress(s) : s))
        .join(','),
      listing_by,
    };
  }) as PropertyDataModel[];
}

const prefix = '[Pipeline]';

export async function POST(req: NextRequest, { internal }: { internal?: boolean }) {
  console.log(`\n\n${prefix} Begin`);
  const payload = await req.json();
  // For caching
  const full_s3_file = getCacheKey(payload.query.bool as unknown);
  const full_s3_url = `https://${process.env.NEXT_APP_S3_PAGES_BUCKET}/${full_s3_file}`;
  let minimized: unknown[] = [];
  const time = Date.now();
  try {
    const cached = await axios.get(full_s3_url);
    console.log(`${Date.now() - time}ms ${prefix} cache retrieved`);
    minimized = cached.data;
  } catch (e) {
    console.log('Skipping cache', full_s3_url);
  }
  // end logic for cachhing
  let phase_1: PropertyDataModel[] = [];
  try {
    if (!minimized || minimized.length === 0) {
      const rels = await getPropertyAttributes(req, true);
      console.log(`${Date.now() - time}ms ${prefix} relationship data retrieved`);

      const {
        data: {
          hits: { hits },
        },
      } = await axios.post(process.env.NEXT_APP_LEGACY_PIPELINE_URL as string, payload, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`${Date.now() - time}ms ${prefix} fresh data retrieved`);
      const { real_estate_board } = rels as unknown as {
        real_estate_board: { name: string; id: number }[];
      };
      phase_1 = mapData(hits, real_estate_board);
      minimized = phase_1.map((p: PropertyDataModel) => {
        const { mls_id, status, area, city, postal_zip_code, state_province, beds, baths, title, asking_price, cover_photo, year_built, floor_area, lat, lon } =
          p;
        return { mls_id, status, area, city, postal_zip_code, state_province, beds, baths, title, asking_price, cover_photo, year_built, floor_area, lat, lon };
      });
      createCacheItem(JSON.stringify(minimized), full_s3_file);
    } else {
      axios
        .post(process.env.NEXT_APP_LEGACY_PIPELINE_URL as string, payload, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.NEXT_APP_LEGACY_PIPELINE_USER}:${process.env.NEXT_APP_LEGACY_PIPELINE_PW}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        })
        .then(({ data }) => {
          const {
            hits: { hits },
          } = data;
          getPropertyAttributes(req, true).then(rels => {
            const { real_estate_board } = rels as unknown as {
              real_estate_board: { name: string; id: number }[];
            };
            phase_1 = mapData(hits, real_estate_board);
            createCacheItem(
              JSON.stringify(
                phase_1.map((p: PropertyDataModel) => {
                  const {
                    mls_id,
                    status,
                    area,
                    city,
                    postal_zip_code,
                    state_province,
                    beds,
                    baths,
                    title,
                    asking_price,
                    cover_photo,
                    year_built,
                    floor_area,
                    lat,
                    lon,
                  } = p;
                  return {
                    mls_id,
                    status,
                    area,
                    city,
                    postal_zip_code,
                    state_province,
                    beds,
                    baths,
                    title,
                    asking_price,
                    cover_photo,
                    year_built,
                    floor_area,
                    lat,
                    lon,
                  };
                }),
              ),
              full_s3_file,
            );
          });
        });
    }

    try {
      console.log(`${Date.now() - time}ms ${prefix} completed`);
      if (internal) return minimized;
      return getResponse({ records: minimized });
    } catch (e) {
      console.error(e);

      console.error(phase_1);
    }
  } catch (e) {
    const err = e as AxiosError;
    if (err.response?.data) {
      const { error } = err.response.data as unknown as {
        error: any;
      };
      console.error(JSON.stringify(error, null, 4));
    }
  }
}
function getCacheKey(legacy_params: unknown) {
  const { filter, should } = legacy_params as {
    filter: {
      range?: {
        [k: string]: {
          lte?: number;
          gte?: number;
        };
      };
      match?: { [k: string]: string };
    }[];
    should: {
      match?: { [k: string]: string };
    }[];
  };
  const cache_key: string[] = [];
  const generic_keys = ['IdxInclude-Yes'];
  filter.forEach(f => {
    if (f.range) {
      const [key] = Object.keys(f.range);
      const kv = `${getAlias(key)}/${objectToQueryString(f.range[key])
        .split('&')
        .map(kv => kv.split('=').pop())
        .join(',')}`;
      if (!generic_keys.includes(kv)) cache_key.push(kv);
    }
    if (f.match) {
      const [key] = Object.keys(f.match);
      const kv = `${getAlias(key)}/${f.match[key].split(' ').join('+')}`;
      if (!generic_keys.includes(kv)) cache_key.push(kv);
    }
  });
  should.forEach(f => {
    if (f.match) {
      const [key] = Object.keys(f.match);
      const kv = `${getAlias(key)}/${f.match[key].split(' ').join('+')}`;
      if (!generic_keys.includes(kv)) cache_key.push(kv);
    }
  });

  return (
    'map-data/' +
    Object.keys(cache_key)
      .sort()
      .map(k => `${(cache_key as unknown as { [k: string]: string })[k]}`)
      .join('/')
  );
}
function getAlias(key: string) {
  const legacy_field_name = key.split('data.').join('');
  return STRAPI_FIELDS[legacy_field_name] || legacy_field_name;
}
