import { retrieveFromLegacyPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body: {
    [k: string]: unknown;
  } = {
    error: 'Unable to retrieve listings',
  };
  let status = 400;

  try {
    const payload = await request.json();
    delete payload.script_fields;
    if (payload.fields) payload.fields.push('data.photos');
    if (!payload.size) payload.size = 800;

    body.properties = await retrieveFromLegacyPipeline(payload);
    status = 200;
  } catch (e) {}

  return NextResponse.json(body, {
    status,
  });
}
