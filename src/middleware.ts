import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WEBFLOW_DASHBOARDS } from './_typings/webflow';
import { getAgentBy } from './app/api/_helpers/agent-helper';
import { objectToQueryString } from './_utilities/url-helper';
import { getPropertyByMlsId } from './app/api/properties/model';
import { formatValues } from './_utilities/data-helpers/property-page';
import { getShortPrice } from './_utilities/data-helpers/price-helper';

const REALTOR_STATIC_PAGES = ['pricing', 'examples', 'contact'];
const SKIP_AGENT_SEARCH = ['cdn-cgi'];
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Store current request url in a custom header, which you can read later
  // we want to be able to read Property ID (MLS_ID, etc)
  // to place meta tags in HEAD dynamically based on Property Data
  const { origin, hostname, pathname, searchParams } = new URL(request.url);
  if (pathname.includes('/api')) return response;
  if (pathname.includes('/css')) return response;
  if (pathname.includes('next')) return response;
  if (pathname.includes('images')) return response;
  if (pathname.includes('icons')) return response;
  if (pathname.includes('wf_graphql')) return response;
  response.headers.set('x-page-title', 'Leagent');

  const [, ...segments] = pathname.split('/');
  let page_url = `https://sites.leagent.com/`;
  response.headers.set('x-viewer', 'realtor');
  response.headers.set('x-canonical', `${origin}${pathname || ''}`);
  response.headers.set('x-hostname', `${hostname || ''}`);

  let agent_data =
    hostname === 'leagent.com' || (segments && segments[0] === 'log-in')
      ? {}
      : await getAgentBy({
          domain_name: hostname,
        });

  if (!agent_data?.agent_id && searchParams.get('agent')) {
    agent_data = await getAgentBy({
      agent_id: searchParams.get('agent') as string,
    });
  }

  if (!agent_data?.agent_id && segments.length === 2 && searchParams.get('theme')) {
    agent_data = await getAgentBy({
      agent_id: segments[0],
    });
  }

  if (agent_data?.agent_id) {
    response.headers.set('x-agent-id', agent_data.agent_id);
    response.headers.set('x-profile-slug', agent_data.metatags.profile_slug);
  }

  if (searchParams.get('theme') || agent_data?.agent_id) {
    response.headers.set('x-viewer', 'customer');
    const theme = searchParams.get('theme') || agent_data.website_theme;
    switch (theme) {
      case 'oslo':
      case 'lisbon':
      case 'malta':
      case 'malaga':
      case 'alicante':
      case 'hamburg':
        page_url = `${page_url}${searchParams.get('theme')}-leagent.webflow.io`;
        break;
      default:
        page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}`;
    }
    if (segments[0] === '' || segments[0] === agent_data?.agent_id) {
      page_url = `${page_url}/index`;
    } else {
      page_url = `${page_url}/${segments.join('/')}`;
    }
    response.headers.set('x-search-params', searchParams.toString());
  } else if (segments.includes('ai-result')) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/ai-result`;
    // } else if (searchParams.get('paragon') && !segments.includes('ai-result')) {
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
  } else if (segments.length >= 2 && !SKIP_AGENT_SEARCH.includes(segments[0])) {
    response.headers.set('x-agent-id', segments[0]);
    response.headers.set('x-profile-slug', segments[1]);
    response.headers.set('x-viewer', 'customer');

    agent_data = await getAgentBy({
      agent_id: segments[0],
    });
    if (agent_data?.metatags) {
      response.headers.set('x-page-title', agent_data.metatags.title);
      response.headers.set('x-page-description', agent_data.metatags.description.split('•').join(''));
      response.headers.set('x-facebook-url', agent_data.metatags.facebook_url || '');
      response.headers.set('x-linkedin-url', agent_data.metatags.linkedin_url || '');
      response.headers.set('x-youtube-url', agent_data.metatags.youtube_url || '');
      response.headers.set('x-instagram-url', agent_data.metatags.instagram_url || '');
    } else {
      console.log('');
      console.log('---');
      console.log('Potentially fatal error searching for agent_id', segments[0]);
      console.log('---');
      console.log('');
    }
    if (!segments[2]) {
      page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/index`;
    } else if (['map', 'id', 'property', 'login', 'log-in', 'sign-up', 'update-password'].includes(segments[2])) {
      if (segments[2] === 'property') {
        if (searchParams.get('mls')) {
          const property = await getPropertyByMlsId(searchParams.get('mls') as string);
          if (property) {
            const home_style = property.style_type || property.residential_type || property.property_type;
            response.headers.set(
              'x-page-title',
              `${getShortPrice(property.asking_price)} ${property.area} ${home_style} ${formatValues(property, 'title')} | ${agent_data.metatags.title}`
                .split('•')
                .join(''),
            );
            if (property.description) {
              response.headers.set(
                'x-page-description',
                property.description.replace(/[\u00A0-\u9999<>\&]/g, i => '&#' + i.charCodeAt(0) + ';'),
              );
            }
            if (property.cover_photo) {
              response.headers.set('x-page-image', property.cover_photo);
            }
          }
        }

        page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/property/propertyid`;
      } else page_url = `${page_url}${agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/${segments[2]}`;
    } else page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/${segments[2]}`;
  } else if (pathname === '/') {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/index`;
  } else if (REALTOR_STATIC_PAGES.filter(page => pathname === '/' + page).length >= 1) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}${pathname}`;
  } else if (pathname === '/pdf') {
    response.headers.set('Content-Type', 'application/pdf');
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/brochure`;
  } else {
    if (request.cookies.get('session_as')?.value === 'realtor') page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}${pathname || ''}`;
    else page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}${pathname || ''}`;
  }

  if (agent_data) {
    if (agent_data.metatags) {
      response.headers.set('x-metatag-id', agent_data.metatags.id);
      response.headers.set('x-dark-bg-logo', agent_data.metatags.logo_for_dark_bg || '');
      response.headers.set('x-light-bg-logo', agent_data.metatags.logo_for_light_bg || '');
      if (agent_data.metatags.headshot) response.headers.set('x-agent-headshot', agent_data.metatags.headshot);
      if (agent_data.metatags.geocoding) {
        response.headers.set(
          'x-map-uri',
          `${agent_data.domain_name ? '' : '/' + segments.slice(0, 2).join('/')}/map?` + objectToQueryString(agent_data.metatags.geocoding),
        );
      }
    }
    response.headers.set('x-record-id', agent_data.id);
    response.headers.set(
      'x-wf-domain',
      searchParams.get('theme') === 'default' ? `leagent-webflow-rebuild.webflow.io` : agent_data.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER,
    );
    response.headers.set('x-agent-name', agent_data.full_name);
    response.headers.set('x-agent-email', agent_data.email);
    response.headers.set('x-agent-phone', agent_data.phone);
  }

  if (page_url.includes('/undefined')) page_url = page_url.split('/undefined').join('');

  if (!page_url.includes('/_next') && !page_url.includes('.ico') && !page_url.includes('.wf_graphql')) {
    if (!request.cookies.get('session_as')) response.cookies.set('session_as', page_url.indexOf(WEBFLOW_DASHBOARDS.CUSTOMER) >= 0 ? 'customer' : 'realtor');
    if (page_url.endsWith('.io')) page_url = `${page_url}/index`;

    page_url = `${page_url}.html`;
    response.headers.set('x-url', page_url);
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
