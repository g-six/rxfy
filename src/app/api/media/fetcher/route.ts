import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let response_body: { [k: string]: unknown } = {
    error: 'Invalid request',
  };
  let status = 400;
  try {
    const { url } = await req.json();
    if (url) {
      status = 200;
      return await fetch(url);
    }
  } catch (e) {
    console.error(e);
  }
  return NextResponse.json(response_body, {
    status,
  });
}
