import { getTokenAndGuidFromSessionKey } from '@/_utilities/api-calls/token-extractor';
import { getResponse } from '@/app/api/response-helper';
import { getNewSessionKey } from '@/app/api/update-session';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { [k: string]: string } }) {
  if (!req.headers.get('authorization')) {
    return getResponse({
      message: 'This request is only available for registered users',
    });
  }
  try {
    const { token, guid } = getTokenAndGuidFromSessionKey(req.headers.get('authorization') || '');
    const user = await getNewSessionKey(token, guid);
    return getResponse({
      src: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/url-https%3A%2F%2Fpages.leagent.com%2Ficons%2Fmap-pin.png%3Fv%3D1(${params.lng},${params.lat})/${params.lng},${params.lat},13,0,60/${params.dimensions}?access_token=${process.env.NEXT_APP_MAPBOX_TOKEN}`,
      token,
      user,
    });
  } catch (e) {
    console.error(e);
    return getResponse({
      message: 'There was an unhandled error exception in api.map.static',
    });
  }
}
