import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    if (Object.keys(payload).length > 0) {
      if (payload.search_for) {
        return NextResponse.json({
          data: payload.search_for,
        });
      }
    } else {
      return NextResponse.json(
        {
          error: 'Invalid payload',
        },
        {
          status: 400,
        },
      );
    }
  } catch (e) {
    console.log('Caught error:');
    console.error(e);
    console.log('End of caught error:');
    return NextResponse.json(
      {
        error: 'Invalid payload',
      },
      {
        status: 400,
      },
    );
  }
}
