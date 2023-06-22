import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Store current request url in a custom header, which you can read later
  // we want to be able to read Property ID (MLS_ID, etc)
  // to place meta tags in HEAD dynamically based on Property Data
  const { origin, pathname } = new URL(request.url);
  const [, possible_agent_id, possible_slug, agent_page] = pathname.split('/');
  if (possible_agent_id && possible_slug && possible_slug.indexOf('la-') === 0) {
    response.cookies.set('agent_id', possible_agent_id);
    response.cookies.set('profile_slug', possible_slug);
    response.cookies.set('session_as', 'customer');
    response.headers.set('x-url', `${origin}/${agent_page}`);
  } else {
    response.headers.set('x-url', request.url);
  }
  const allCookies = request.cookies.getAll();
  allCookies.forEach(({ name, value }) => {
    response.headers.set(`x-${name.split('_').join('-')}`, value);
  });

  return response;
}
