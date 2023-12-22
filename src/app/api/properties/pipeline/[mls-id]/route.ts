import { consoler } from '@/_helpers/consoler';
import { NextRequest, NextResponse } from 'next/server';
import { getPropertyByMlsId } from '@/app/api/properties/model';
import { getPropertyAttributes } from '@/app/api/property-attributes/model';

const FILE = 'api/properties/pipeline/[mls-id]/route.ts';
export async function POST(req: NextRequest, { params }: { params: { 'mls-id': string } }) {
  const payload = await req.json();
  const mls_id = params['mls-id'];
  let updates: {
    [k: string]: {
      strapi: string | number;
      board: string | number;
    };
  } = {};
  if (payload.mls_id) {
    const relationships = await getPropertyAttributes();
    const existing = await getPropertyByMlsId(mls_id);
    if (existing?.id) {
      let { id, ...listing } = existing;
      Object.keys(listing).forEach(field => {
        if (payload[field]) {
          const { [field]: strapi } = listing as unknown as { [k: string]: string | number };

          if (payload[field] !== strapi) {
            updates = {
              ...updates,
              [field]: {
                strapi,
                board: payload[field],
              },
            };
          }
        }
      });
    }
  }
  return NextResponse.json({
    mls_id: params['mls-id'],
    updates,
    // data: payload,
  });
}
