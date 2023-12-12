import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getAgentBy } from './app/api/_helpers/agent-helper';
import { getThemeDomainHostname, getWebflowDomain } from './_helpers/themes';
import { setAgentWebsiteHeaders } from './_helpers/head-manipulations';
import { consoler } from './_helpers/consoler';
import { AgentData } from './_typings/agent';
import { cookies } from 'next/headers';
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

  let [, ...segments] = pathname.split('/');
  segments = segments.filter(s => !!s);

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
