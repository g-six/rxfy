import { consoler } from '@/_helpers/consoler';
import { NextRequest, NextResponse } from 'next/server';

const FILE = 'api/properties/pipeline/[mls-id]/route.ts';
export async function POST(req: NextRequest, { params }: { params: { 'mls-id': string } }) {
  const payload = await req.json();
  consoler(FILE, payload);
  return NextResponse.json({
    mls_id: params['mls-id'],
    data: payload,
  });
}
