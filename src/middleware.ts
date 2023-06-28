import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WEBFLOW_DASHBOARDS } from './_typings/webflow';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Store current request url in a custom header, which you can read later
  // we want to be able to read Property ID (MLS_ID, etc)
  // to place meta tags in HEAD dynamically based on Property Data
  const { origin, pathname, searchParams, search } = new URL(request.url);
  const [, ...segments] = pathname.split('/');
  let page_url = `https://`;
  response.headers.set('x-viewer', 'realtor');

  if (segments[0] === 'property') {
    response.headers.set('x-viewer', 'customer');
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/property/propertyid`;
  } else if (segments[0].indexOf('ai') === 0) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/${segments.join('/')}`;
  } else if (segments[0].indexOf('my-') === 0) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/${segments.join('/')}`;
  } else if (segments[0].indexOf('dash-my') === 0) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/${segments.join('/')}`;
  } else if (segments[0] === 'map') {
    response.headers.set('x-viewer', 'customer');
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/map`;
  } else if (segments.length > 2 && segments[1].indexOf('la-') === 0) {
    response.headers.set('x-agent-id', segments[0]);
    response.headers.set('x-profile-slug', segments[1]);
    response.headers.set('x-viewer', 'customer');

    if (segments[2] === 'map') page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/map`;
    else if (segments[2] === 'property') page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/property/propertyid`;
  } else if (pathname === '/') {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}`;
  } else {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}${pathname}`;
  }

  response.cookies.set('session_as', page_url.indexOf(WEBFLOW_DASHBOARDS.CUSTOMER) >= 0 ? 'customer' : 'realtor');
  response.headers.set('x-url', page_url);

  if (searchParams.get('key') && !request.cookies.get('session_key')) {
    response.cookies.set('session_key', searchParams.get('key') as string);
  }

  const allCookies = request.cookies.getAll();
  allCookies.forEach(({ name, value }) => {
    response.headers.set(`x-${name.split('_').join('-')}`, value);
  });

  console.log('Middleware set page url to', page_url);

  return response;
}
