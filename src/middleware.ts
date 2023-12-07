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
  const current_url = request.headers.get('referer') || request.url;
  const { hostname, searchParams, protocol } = new URL(request.url);
  const current_origin = request.headers.get('host') ? `${protocol}//${request.headers.get('host')}` : '';
  response.headers.set('x-rx-origin', current_origin);
  let { pathname } = new URL(request.url);

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
  let agent_id = '';
  segments = segments.filter(s => !!s);

  let agent_data: { [k: string]: string } & { metatags?: { [k: string]: string } } = {};
  let page_url = `https://sites.leagent.com/`;
  response.headers.set('x-viewer', 'realtor');
  const domain_name = getThemeDomainHostname(`${request.headers.get('host') || hostname}`.split(':').reverse().pop() || hostname) || hostname;
  let webflow_domain = getWebflowDomain(domain_name);

  let debug_output = `
        Proceed to routing logic for:
        current_url     : ${current_url}
        domain_name     : ${domain_name}
        current_origin  : ${current_origin}
        pathname        : ${pathname}
        segments        : ${JSON.stringify(segments)}
`;

  // Domain name is not of *.leagent.com, must be a realtor with own domain set up.
  if (!webflow_domain && domain_name) {
    agent_data = await getAgentBy({
      domain_name,
    });
    if (agent_data?.webflow_domain) {
      consoler(
        FILE,
        `if (agent_data?.agent_metatag) :
        ${debug_output}
        webflow_domain  : ${agent_data.webflow_domain}
    `,
      );
      return setAgentWebsiteHeaders(agent_data as unknown as AgentData, request, response);
    }
  }

  debug_output = `${debug_output}  
        webflow_domain  : ${webflow_domain}
  `;

  if (webflow_domain !== 'leagent-website.webflow.io') {
    if (segments.length > 1) agent_id = segments[0];
  }

  if (searchParams.get('key') && searchParams.get('as') && current_url && !pathname.includes('log-')) {
    if (!cookies().get('session_as') || !cookies().get('session_key')) {
      response.cookies.set('session_key', searchParams.get('key') || '');
      response.cookies.set('session_as', searchParams.get('as') || '');
    }
  }

  let canonical = '';
  // Specifying a theme search parameter with agent_id
  // in path param will bypass all theme logic
  // outside this conditional statement
  if (searchParams.get('theme')) {
    // For theme preview requests from an iframe
    const theme_subdomain = searchParams.get('theme') === 'default' ? 'app' : searchParams.get('theme');
    const webflow_subdomain = theme_subdomain !== 'app' ? `${searchParams.get('theme')}-leagent` : 'leagent-webflow-rebuild';
    canonical = `https://${theme_subdomain}.leagent.com${segments.length ? '/' : ''}${segments.join('/')}`;
    agent_data = await getAgentBy({
      agent_id: segments[0],
    });
    if (agent_data?.agent_metatag) {
      webflow_domain = `${webflow_subdomain}.webflow.io`;
      page_url = `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/index.html`;

      response.headers.set('x-preview-theme', searchParams.get('theme') || '');
      response.headers.set('x-url', page_url);
      response.headers.set('x-hostname', `${domain_name || ''}`);

      consoler(
        FILE,
        `if (agent_data?.agent_metatag) {...
        ${debug_output}
    `,
      );

      if (canonical) {
        response.headers.set('x-canonical', canonical);
      }
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

    if (canonical) {
      response.headers.set('x-canonical', canonical);
    }

    response.headers.set('x-hostname', `${domain_name || ''}`);
  }

  response.headers.set('x-search-params', searchParams.toString());

  if (segments.includes('_next')) return request;

  // If the domain is a leagent owned theme domain,
  // default the strapi.agents.agent_id to ONKODA
  let filename = segments.length === 0 ? 'index' : segments.join('/');
  if (webflow_domain === 'leagent-website.webflow.io') {
    response.headers.set('x-url', `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/${filename}.html`);
  } else if (webflow_domain?.includes('-leagent.webflow.io')) {
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

      consoler(
        FILE,
        `//Directory based website and webflow_domain explicitly chosen via subdomain...
        ${debug_output}
    `,
      );

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
      consoler(
        FILE,
        `if (agent_data?.agent_id) { ...
          ${debug_output}
        `,
      );
      return setAgentWebsiteHeaders(agent_data as unknown as AgentData, request, response);
      // return setAgentWebsiteHeaders(agent_data as unknown as AgentData);
    }
  } else {
    if (filename.includes('ai-result')) {
      filename = 'ai-result';
    }
    response.headers.set('x-url', `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${webflow_domain}/${filename}.html`);
  }

  consoler(
    FILE,
    `[MISS]
    ${debug_output}
    `,
  );
  return response;
}
