import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const payload = await req.json();
  console.log(payload);
  return NextResponse.json({ payload });
}
