import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { 'mls-id': string } }) {
  const payload = await req.json();
  return NextResponse.json({
    mls_id: params['mls-id'],
    data: payload,
  });
}
