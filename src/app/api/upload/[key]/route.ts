import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { NextRequest, NextResponse } from 'next/server';
import { getResponse } from '@/app/api/response-helper';
import { deleteObject } from '../../_helpers/s3-helper';

export async function DELETE(request: NextRequest) {
  let session_key = request.headers.get('authorization') || '';
  const { token, guid } = getTokenAndGuidFromSessionKey(session_key);
  if (!token || !guid)
    return getResponse(
      {
        error: 'Please login',
      },
      401,
    );

  try {
    const [, Key] = request.url.split(`${process.env.NEXT_APP_S3_PAGES_BUCKET}/`);
    if (Key) {
      const results = await deleteObject(Key);
      return getResponse({
        results,
        file_path: Key,
        url: `https://${process.env.NEXT_APP_S3_PAGES_BUCKET}/${Key}`,
      });
    }
  } catch (e) {
    return getResponse(
      {
        error: 'Caught exception. Delete operation failed',
      },
      400,
    );
  }
  return getResponse(
    {
      error: 'Delete operation failed',
    },
    400,
  );
}

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  const headers = {
    Authorization: `API_TOKEN ${process.env.NEXT_APP_CLOUDCAPTURE_API_KEY}`,
  };
  const url = `https://cloudcapture.cc/api/img?size=${params.key}&url=${request.nextUrl.searchParams.get('url')}`;
  const image = await fetch(url, {
    headers,
    body: undefined,
    method: 'GET',
  });

  if (image.status === 200) {
    const res = await image.blob();
    return new Response(res, {
      headers: image.headers,
    });
  }
  return getResponse({
    type: image.headers.get('Content-Type'),
  });
}
