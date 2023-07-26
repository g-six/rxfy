import axios, { AxiosError } from 'axios';
import { NextRequest } from 'next/server';
import { getResponse } from '../response-helper';
import { STRAPI_FIELDS } from '@/_utilities/api-calls/call-legacy-search';
import { GET as getPropertyAttributes } from '@/app/api/property-attributes/route';
import { formatAddress } from '@/_utilities/string-helper';
import { PropertyDataModel } from '@/_typings/property';

export async function POST(req: NextRequest) {
  const rels = await getPropertyAttributes(req, true);
  const { real_estate_board } = rels as unknown as {
    real_estate_board: { name: string; id: number }[];
  };
  const payload = await req.json();
  try {
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
    const phase_1 = hits.map(
      (p: {
        _source: {
          data: Record<string, unknown>;
        };
      }) => {
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
            } else if (real_estate_board.map(r => r.name).includes(data[k] as string)) {
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
      },
    );

    try {
      const minimized = phase_1.map((p: PropertyDataModel) => {
        const { mls_id, area, city, postal_zip_code, state_province, beds, baths, title, asking_price, cover_photo, year_built, floor_area, lat, lon } = p;
        return { mls_id, area, city, postal_zip_code, state_province, beds, baths, title, asking_price, cover_photo, year_built, floor_area, lat, lon };
      });
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
