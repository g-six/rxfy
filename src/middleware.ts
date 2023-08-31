import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WEBFLOW_DASHBOARDS } from './_typings/webflow';
import { getAgentBy } from './app/api/_helpers/agent-helper';
import { objectToQueryString } from './_utilities/url-helper';

const REALTOR_STATIC_PAGES = ['pricing', 'examples', 'contact'];
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Store current request url in a custom header, which you can read later
  // we want to be able to read Property ID (MLS_ID, etc)
  // to place meta tags in HEAD dynamically based on Property Data
  const { origin, pathname, searchParams } = new URL(request.url);

  if (pathname.includes('/api')) return response;
  if (pathname.includes('/css')) return response;
  if (pathname.includes('next')) return response;
  if (pathname.includes('images')) return response;
  if (pathname.includes('icons')) return response;
  if (pathname.includes('wf_graphql')) return response;

  const [, ...segments] = pathname.split('/');
  let page_url = `https://sites.leagent.com/`;
  response.headers.set('x-viewer', 'realtor');
  response.headers.set('x-canonical', `${origin}${pathname || ''}`);

  if (searchParams.get('paragon') && !segments.includes('ai-result')) {
    response.headers.set('x-viewer', 'customer');
    switch (searchParams.get('theme')) {
      case 'oslo':
      case 'lisbon':
      case 'malta':
      case 'malaga':
      case 'hamburg':
        page_url = `${page_url}${searchParams.get('theme')}-leagent.webflow.io`;
        break;
      default:
        page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}`;
    }
  } else if (segments[0] === 'property') {
    response.headers.set('x-viewer', 'customer');
    page_url = `${page_url}/property/propertyid`;
  } else if (segments[0] === 'log-in') {
    response.headers.set('x-viewer', 'realtor');
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/log-in`;
  } else if (segments[0] === 'brochure') {
    response.headers.set('x-viewer', 'customer');
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/brochure`;
  } else if (segments[0].indexOf('ai') === 0) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/${segments.join('/')}`;
  } else if (['my-documents'].includes(segments[0])) {
    response.headers.set('x-viewer', 'customer');
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/${segments.join('/')}`;
  } else if (segments[0].indexOf('my-') === 0) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/${segments.join('/')}`;
  } else if (segments[0].indexOf('dash-my') === 0) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/${segments.join('/')}`;
  } else if (segments[0] === 'map') {
    response.headers.set('x-viewer', 'customer');
    response.headers.set('x-search-params', searchParams.toString());

    page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/map`;
  } else if (pathname && pathname === '/client-dashboard') {
    response.headers.set('x-viewer', 'customer');
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}${pathname}`;
  } else if (segments.length >= 2 && segments[1].indexOf('la-') === 0) {
    response.headers.set('x-agent-id', segments[0]);
    response.headers.set('x-profile-slug', segments[1]);
    response.headers.set('x-viewer', 'customer');

    const agent_data = await getAgentBy({
      agent_id: segments[0],
    });
    response.headers.set('x-dark-bg-logo', agent_data.metatags.logo_for_dark_bg || agent_data.metatags.logo_for_light_bg || '/leagent-icon.png');
    response.headers.set('x-light-bg-logo', agent_data.metatags.logo_for_light_bg || agent_data.metatags.logo_for_dark_bg || '/leagent-icon.png');
    response.headers.set('x-page-title', agent_data.metatags.title);
    response.headers.set('x-page-description', agent_data.metatags.description);
    response.headers.set('x-record-id', agent_data.id);
    response.headers.set('x-wf-domain', agent_data.webflow_domain);
    response.headers.set('x-metatag-id', agent_data.metatags.id);
    response.headers.set('x-agent-name', agent_data.full_name);
    response.headers.set('x-agent-email', agent_data.email);
    response.headers.set('x-agent-phone', agent_data.phone);
    response.headers.set('x-agent-headshot', agent_data.metatags.headshot);

    if (agent_data?.metatags.geocoding) {
      response.headers.set(
        'x-map-uri',
        `${agent_data.domain_name ? '' : '/' + segments.slice(0, 2).join('/')}/map?` + objectToQueryString(agent_data.metatags.geocoding),
      );
    }

    if (['my-profile', 'map', 'reset-password', 'my-home-alerts', 'my-compare', 'my-all-properties'].includes(segments[2])) {
      page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/${segments[2]}`;
    } else if (segments[2] === 'map') page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/map`;
    else if (segments[2] === 'id') page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/id`;
    else if (segments[2] === 'property') page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/property/propertyid`;
    else if (segments[2] === 'update-password') page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/update-password`;
    else if (segments[2] === 'log-in') page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/log-in`;
    else if (segments[2] === 'login') page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/login`;
    else if (segments[2] === 'sign-up') page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/sign-up`;
    else if (segments[2] === 'my-account') page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/my-account`;
    else if (segments[2] === 'client-dashboard') page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/client-dashboard`;
    else page_url = `${page_url}${agent_data.webflow_domain}/index`;
  } else if (pathname === '/') {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/index`;
  } else if (REALTOR_STATIC_PAGES.filter(page => pathname === '/' + page).length >= 1) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}${pathname}`;
  } else if (pathname === '/pdf') {
    response.headers.set('Content-Type', 'application/pdf');
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}${pathname}`;
  } else {
    if (request.cookies.get('session_as')?.value === 'realtor') page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}${pathname || ''}`;
    else page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}${pathname || ''}`;
  }

  if (page_url.includes('/undefined')) page_url = page_url.split('/undefined').join('');

  if (!page_url.includes('/_next') && !page_url.includes('.ico') && !page_url.includes('.wf_graphql')) {
    if (!request.cookies.get('session_as')) response.cookies.set('session_as', page_url.indexOf(WEBFLOW_DASHBOARDS.CUSTOMER) >= 0 ? 'customer' : 'realtor');
    response.headers.set('x-url', page_url + '.html');
  }

  if (searchParams.get('key') && !request.cookies.get('session_key')) {
    response.cookies.set('session_key', searchParams.get('key') as string);
  }

  const allCookies = request.cookies.getAll();
  allCookies.forEach(({ name, value }) => {
    response.headers.set(`x-${name.split('_').join('-')}`, value);
  });
  // Do not remove this, need this to be logged in Vercel for various reasons
  if (page_url.indexOf('/_next/') === -1 && pathname !== '/favicon.ico') {
    console.log('middleware', { page_url, origin, pathname });
  }
  return response;
}
