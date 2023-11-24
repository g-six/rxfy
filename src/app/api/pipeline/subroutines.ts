import { PropertyDataModel } from '@/_typings/property';
import { STRAPI_FIELDS } from '@/_utilities/api-calls/call-legacy-search';
import { formatAddress } from '@/_utilities/string-helper';
import { getPropertyAttributes } from '../property-attributes/model';
import axios from 'axios';

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
