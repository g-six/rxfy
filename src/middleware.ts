import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCustomerLoves } from './app/api/agents/customer/[id]/loves/model';
import { LovedPropertyDataModel } from './_typings/property';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Store current request url in a custom header, which you can read later
  // we want to be able to read Property ID (MLS_ID, etc)
  // to place meta tags in HEAD dynamically based on Property Data
  const { origin, pathname, searchParams, search } = new URL(request.url);
  const [, possible_agent_id, possible_slug, agent_page] = pathname.split('/');
  if (searchParams.get('key') && !request.cookies.get('session_key')) {
    response.cookies.set('session_key', searchParams.get('key') as string);
  }
  if (possible_agent_id && possible_slug && possible_slug.indexOf('la-') === 0) {
    response.cookies.set('agent_id', possible_agent_id);
    response.cookies.set('profile_slug', possible_slug);
    response.cookies.set('session_as', 'customer');
    response.headers.set('x-url', `${origin}${agent_page ? `/${agent_page}${search}` : search}`);
  } else {
    response.headers.set('x-url', request.url);
  }

  const allCookies = request.cookies.getAll();
  allCookies.forEach(({ name, value }) => {
    response.headers.set(`x-${name.split('_').join('-')}`, value);
  });

  return response;
}
