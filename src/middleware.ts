import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { WEBFLOW_DASHBOARDS } from './_typings/webflow';
import { getAgentBy } from './app/api/_helpers/agent-helper';
import { objectToQueryString } from './_utilities/url-helper';
import { getPropertyByMlsId } from './app/api/properties/model';
import { formatValues } from './_utilities/data-helpers/property-page';
import { getShortPrice } from './_utilities/data-helpers/price-helper';
import { LEAGENT_WEBFLOW_DOMAINS } from './_constants/webflow-domains';
import { savePageToBucket } from './app/api/webhooks/utility';
import { getThemeDomainHostname, getWebflowDomain } from './_helpers/themes';
import { setAgentWebsiteHeaders } from './_helpers/head-manipulations';
import { consoler } from './_helpers/consoler';
import { AgentData } from './_typings/agent';
const FILE = 'middleware.ts';
const BUCKET_NAME = process.env.NEXT_PUBLIC_RX_SITE_BUCKET as string;
const REALTOR_STATIC_PAGES = ['pricing', 'examples', 'contact'];
const GATED_PAGES = ['my-profile', 'my-listings'];
const REALTOR_MAIN_PAGES = ['property', 'map', 'communities'];
const SKIP_AGENT_SEARCH = ['cdn-cgi'];
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Store current request url in a custom header, which you can read later
  // we want to be able to read Property ID (MLS_ID, etc)
  // to place meta tags in HEAD dynamically based on Property Data
  const current_url = new URL(request.url);
  const { origin, hostname, searchParams } = current_url;
  let { pathname } = current_url;

  if (pathname.includes('/api')) return response;
  if (pathname.includes('/css')) return response;
  if (pathname.includes('next')) return response;
  if (pathname.includes('images')) return response;
  if (pathname.includes('icons')) return response;
  if (pathname.includes('wf_graphql')) return response;
  if (pathname.includes('favicon')) return response;
  consoler('middleware.ts', '       not a webflow static asset       ', '       Proceed to routing logic       ');

  const [, ...segments] = pathname.split('/');

  let agent_data: { [k: string]: string } & { metatags?: { [k: string]: string } } = {};
  let page_url = `https://sites.leagent.com/`;
  response.headers.set('x-viewer', 'realtor');
  const domain_name = getThemeDomainHostname(`${request.headers.get('host') || hostname}`.split(':').reverse().pop() || hostname);
  let webflow_domain = getWebflowDomain(`${request.headers.get('host') || hostname}`.split(':').reverse().pop() || hostname);
  let canonical = '';

  // Specifying a theme search parameter with agent_id
  // in path param will bypass all theme logic
  // outside this conditional statement
  if (searchParams.get('theme') && segments[0]) {
    // For theme preview requests from an iframe
    const theme_subdomain = searchParams.get('theme') === 'default' ? 'app' : searchParams.get('theme');
    const webflow_subdomain = theme_subdomain !== 'app' ? `${searchParams.get('theme')}-leagent` : 'leagent-webflow-rebuild';
    canonical = `https://${theme_subdomain}.leagent.com/${segments[0]}`;
    agent_data = await getAgentBy({
      agent_id: segments[0],
    });
    if (agent_data?.agent_metatag) {
      webflow_domain = `${webflow_subdomain}.webflow.io`;
      page_url = `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/index.html`;

      response.headers.set('x-preview-theme', searchParams.get('theme') || '');
      response.headers.set('x-url', page_url);
      response.headers.set('x-hostname', `${domain_name || ''}`);
      return setAgentWebsiteHeaders(
        {
          ...(agent_data as unknown as AgentData),
          webflow_domain,
        },
        request,
        response,
      );
    }
  } else {
    canonical = `https://${domain_name}${segments[0] ? '/' : ''}${segments.join('/') || ''}`;

    response.headers.set('x-hostname', `${domain_name || ''}`);
  }

  response.headers.set('x-search-params', searchParams.toString());

  if (segments.includes('_next')) return request;

  if (canonical) {
    response.headers.set('x-canonical', canonical);
  }

  // If the domain is a leagent owned theme domain,
  // default the strapi.agents.agent_id to ONKODA
  if (domain_name !== 'leagent.com') {
    if (!segments[0] && domain_name.includes('leagent.com')) {
      agent_data = await getAgentBy({
        agent_id: 'ONKODA',
      });
      if (webflow_domain && agent_data) {
        agent_data = {
          ...(agent_data as unknown as {}),
          webflow_domain,
        };
      }
      delete agent_data.website_theme;
    } else if (webflow_domain && !webflow_domain.includes('leagent')) {
      agent_data = await getAgentBy({
        webflow_domain,
      });
    } else if (webflow_domain && webflow_domain.includes('leagent') && segments[0]) {
      // Directory based website and webflow_domain explicitly chosen via subdomain
      agent_data = await getAgentBy({
        agent_id: segments[0],
      });
      return setAgentWebsiteHeaders(
        {
          ...(agent_data as unknown as AgentData),
          webflow_domain,
        },
        request,
        response,
      );
    } else if (domain_name) {
      agent_data = await getAgentBy({
        domain_name,
      });
      webflow_domain = agent_data.webflow_domain || '';
    }

    if (agent_data?.agent_id) {
      return setAgentWebsiteHeaders(agent_data as unknown as AgentData, request, response);
      // return setAgentWebsiteHeaders(agent_data as unknown as AgentData);
    }
  } else {
    let filename = segments[0] === '' ? 'index' : segments.join('/');
    if (filename.includes('ai-result')) {
      filename = 'ai-result';
    }
    response.headers.set('x-url', `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/${filename}.html`);
  }

  return response;

  if (searchParams.get('key') && searchParams.get('as')) {
    response.cookies.set('session_key', searchParams.get('key') as string);
    response.cookies.set('session_as', searchParams.get('as') as 'realtor' | 'customer');
  }
  response.headers.set('x-page-title', 'Leagent');

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

  if (!agent_data?.agent_id && segments.length >= 2 && segments[1].includes('la-')) {
    agent_data = await getAgentBy({
      agent_id: segments[0],
    });

    segments.reverse().pop();
    segments.pop();
  }

  if (agent_data?.agent_id && agent_data.metatags?.id) {
    // webflow_domain = agent_data.webflow_domain || '';

    // if (!webflow_domain) {
    //   webflow_domain = WEBFLOW_DASHBOARDS.CUSTOMER;
    //   if (agent_data.theme) webflow_domain = `${agent_data.theme}-leagent.webflow.io`;
    // }

    if (segments.length === 0 || REALTOR_MAIN_PAGES.includes(segments[0]) || pathname === '/' || !LEAGENT_WEBFLOW_DOMAINS.includes(webflow_domain)) {
      if (`${pathname.split('/').pop()}`.split('.').length > 1) return response;
      response.headers.set('x-viewer', 'customer');
      const allCookies = request.cookies.getAll();
      allCookies.forEach(({ name, value }) => {
        response.headers.set(`x-${name.split('_').join('-')}`, value);
      });
      page_url = `https://sites.leagent.com/${webflow_domain}/${segments[0] || 'index'}`;
      if (segments[0] === 'property') page_url = `${page_url}/propertyid`;
      else if (segments.length >= 2) {
        page_url = `${page_url}/${segments.slice(1).join('/')}`;
      }
      page_url = `${page_url}.html`;

      if (segments[0] === 'map') {
        if (!searchParams.has('lat') || !searchParams.has('lat')) {
          return NextResponse.redirect(
            `${origin}/${!agent_data.domain_name ? `${agent_data.agent_id}/${agent_data.metatags.profile_slug}/` : ''}map?${objectToQueryString(
              agent_data.metatags.geocoding as unknown as {},
            )}&baths=0&beds=0`,
          );
        }
      }

      console.log('Going to bring visitor to Realtor page', page_url);
      response.headers.set('x-url', page_url);
      const page_xhr = await fetch(page_url);
      if (!page_xhr.ok) {
        const sitemap_request = await fetch(`https://sites.leagent.com/${webflow_domain}/pages.json`);
        if (sitemap_request.ok) {
          const { pages }: { pages: string[] } = await sitemap_request.json();

          if (pages.includes(segments[0])) {
            await savePageToBucket(`${page_url.split(BUCKET_NAME + '/').pop()}`.split('.html').join(''));
            await sleep(2000);
          }
        }
      }
      return response;
    }
  }

  if (GATED_PAGES.includes(segments[0])) {
    if (!request.cookies.get('session_key')?.value && request.cookies.get('session_as')?.value !== 'realtor') {
      return NextResponse.redirect(new URL('/log-in', request.url));
    }
  }

  if (searchParams.get('theme') || (agent_data?.agent_id && domain_name !== 'leagent.com')) {
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
      // page_url = `${page_url}/${segments.join('/')}`;
    }
  } else if (segments.includes('ai-result')) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}/ai-result`;
    // } else if (searchParams.get('paragon') && !segments.includes('ai-result')) {
  } else if (segments[0] === 'property' || (segments.length > 1 && segments[segments.length - 1] === 'property')) {
    response.headers.set('x-viewer', 'customer');
    page_url = `${page_url}/property/propertyid`.split('//property').join('/property');
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
  } else if (segments.length >= 2 && !SKIP_AGENT_SEARCH.includes(segments[0]) && agent_data?.metatags) {
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
      page_url = `${page_url}${agent_data?.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/index`;
    } else if (['map', 'id', 'property', 'login', 'log-in', 'sign-up', 'update-password'].includes(segments[2])) {
      if (segments[2] === 'property') {
        if (searchParams.get('mls')) {
          const property = await getPropertyByMlsId(searchParams.get('mls') as string);
          if (property) {
            const home_style = property.style_type || property.residential_type || property.property_type;
            response.headers.set(
              'x-page-title',
              `${getShortPrice(property.asking_price)} ${property.area} ${home_style} ${formatValues(property, 'title')}`.split('•').join(''),
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
    if (domain_name !== 'leagent.com') {
      // Agent has custom domain to host homepage
      agent_data = await getAgentBy({
        domain_name,
      });
      if (agent_data && agent_data?.agent_id) {
        if (agent_data.webflow_domain.includes('leagent')) {
          page_url = `${page_url}${agent_data.webflow_domain}/index`;
        }
      }
    }
  } else if (REALTOR_STATIC_PAGES.filter(page => pathname === '/' + page).length >= 1) {
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}${pathname}`;
  } else if (pathname === '/pdf') {
    response.headers.set('Content-Type', 'application/pdf');
    page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}/brochure`;
  } else {
    if (request.cookies.get('session_as')?.value === 'realtor') page_url = `${page_url}${WEBFLOW_DASHBOARDS.REALTOR}${pathname || ''}`;
    else page_url = `${page_url}${WEBFLOW_DASHBOARDS.CUSTOMER}${pathname || ''}`;
  }

  if (agent_data && agent_data.agent_id) {
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
    if (page_url.includes('leagent-website')) response.headers.set('x-url', page_url);
  }

  const allCookies = request.cookies.getAll();
  allCookies.forEach(({ name, value }) => {
    response.headers.set(`x-${name.split('_').join('-')}`, value);
  });
  // Do not remove this, need this to be logged in Vercel for various reasons
  if (page_url && page_url.indexOf('/_next/') === -1 && pathname !== '/favicon.ico') {
    console.log('middleware', { page_url, origin, pathname });
  }

  console.log('  ---- middleware.ts ----->');
  console.log('');
  console.log('');

  return response;
}
