import { AxiosError } from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { getPropertyByMlsId } from '../properties/model';
import { getPipelineData } from './subroutines';

const prefix = '[Pipeline]';

export async function POST(req: NextRequest, { internal }: { internal?: boolean }) {
  console.log(`\n\n${prefix} Begin`);
  const payload = await req.json();
  const time = Date.now();
  // end logic for cachhing
  let phase_1: PropertyDataModel[] = [];
  try {
    const { records, hits } = await getPipelineData(payload);

    if (payload.search_for === 'RECENTLY_SOLD') {
      const sold_properties = await Promise.all(
        records.map(p => {
          return getPropertyByMlsId(
            p.mls_id,
            undefined,
            hits
              .filter((hit: { _source: { data: MLSProperty } }) => hit._source.data.MLS_ID === p.mls_id)
              .map((hit: { _source: { data: MLSProperty } }) => hit._source.data)
              .pop(),
          );
        }),
      );

      return NextResponse.json({ records: sold_properties });
    }

    return NextResponse.json({ records });
  } catch (e) {
    const err = e as AxiosError;
    if (err.response?.data) {
      const { error } = err.response.data as unknown as {
        error: any;
      };
      console.error(JSON.stringify(error, null, 4));
      return NextResponse.json({ error }, { status: 400 });
    }
  }
  return NextResponse.json({ error: 'U.F.O in POST api/pipeline' }, { status: 400 });
}
