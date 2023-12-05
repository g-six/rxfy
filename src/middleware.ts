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
  const current_url = new URL(request.url);
  const { hostname, searchParams } = current_url;
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

  if (searchParams.get('key')) {
    cookies().set('session_key', searchParams.get('key') as string);
    if (searchParams.get('as')) {
      cookies().set('session_as', searchParams.get('as') as string);
    }
    return NextResponse.redirect(request.url.split('?').reverse().pop() as string);
  }
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
  if (domain_name !== 'leagent.com' && domain_name !== 'dev.leagent.com') {
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
}
