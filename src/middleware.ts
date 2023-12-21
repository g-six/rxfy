import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { consoler } from './_helpers/consoler';
import { getUserDataFromSessionKey } from './app/api/update-session';
import { getTokenAndGuidFromSessionKey } from './_utilities/api-calls/token-extractor';

const FILE = 'middleware.ts';
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Store current request url in a custom header, which you can read later
  // we want to be able to read Property ID (MLS_ID, etc)
  // to place meta tags in HEAD dynamically based on Property Data
  const { hostname, searchParams, protocol } = new URL(request.url);
  const current_origin = request.headers.get('host') ? `${protocol}//${request.headers.get('host')}` : '';
  response.headers.set('x-rx-origin', current_origin);
  let { pathname } = new URL(request.url);
  const current_url = `${current_origin}${pathname}`;

  if (pathname.includes('/api')) return response;
  if (pathname.includes('/css')) return response;
  if (pathname.includes('next')) return response;
  if (pathname.includes('images')) return response;
  if (pathname.includes('icons')) return response;
  if (pathname.includes('wf_graphql')) return response;
  if (pathname.includes('favicon')) return response;
  if (pathname.includes('log-out')) {
    response.cookies.delete('session_key');
    response.cookies.delete('session_as');
  }

  // Check if customer is logged in and has an account under this agent
  if (request.cookies.get('session_as')?.value === 'customer') {
    const session_key = request.cookies.get('session_key')?.value;
    if (session_key) {
      const { token, guid } = getTokenAndGuidFromSessionKey(session_key);
      const session = await getUserDataFromSessionKey(token, guid, 'customer');
      //getUserSessionData(session_key, 'customer');
      const { error } = session as unknown as { [k: string]: string };
      if (error) {
        response.cookies.delete('session_key');
      }
    }
  }

  let [, ...segments] = pathname.split('/');
  segments = segments.filter(s => !!s);
  response.headers.set('x-pathname', pathname);

  let agent_data: { [k: string]: string } & { metatags?: { [k: string]: string } } = {};

  let debug_output = `
        Proceed to routing logic for:
        current_url     : ${current_url}
        current_origin  : ${current_origin}
        pathname        : ${pathname}
        segments        : ${JSON.stringify(segments)}
`;

  response.headers.set('x-search-params', searchParams.toString());

  if (segments.includes('_next')) return request;

  consoler(
    FILE,
    `[MISS]
    ${debug_output}
    `,
  );
  return response;
}

console.log = () => {};
