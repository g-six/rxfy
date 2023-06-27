import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';

import Script from 'next/script';

import './globals.scss';
import React from 'react';
import { WebFlow } from '@/_typings/webflow';
import { AgentData } from '@/_typings/agent';
import { getPrivatePropertyData, getPropertyData } from '@/_utilities/data-helpers/property-page';
import { replaceMetaTags } from '@/_helpers/head-manipulations';
import initializePlacesAutocomplete from '@/components/Scripts/places-autocomplete';
import { appendJs, rexifyScripts, rexifyScriptsV2 } from '@/components/rexifier';
import { findAgentRecordByAgentId } from './api/agents/model';
import { attributesToProps } from 'html-react-parser';
import NotFound from './not-found';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const axios = (await import('axios')).default;
  const { NEXT_APP_GGL_API_KEY, TEST_DOMAIN } = process.env;
  const url = headers().get('x-url') as string;

  let { pathname } = new URL(url);
  const requestLink = headers().get('x-url') || '';
  const requestUrl = new URL(requestLink);
  const searchParams = Object.fromEntries(requestUrl.searchParams);
  let data;
  let agent_data: AgentData | undefined = undefined;
  let theme = searchParams.theme;
  let webflow_domain = process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN;
  let page_url = '';
  let agent_id = headers().get('x-agent-id');
  let profile_slug = headers().get('x-profile-slug');
  let page_route: string[] = [];

  if (pathname && pathname.split('/').length >= 3 && !agent_id && !profile_slug) {
    // Check if the slug matches a realtor
    const segments = pathname.split('/');
    page_route = segments.slice(3);
    if (segments[2].indexOf('la-') === 0) {
      agent_id = segments[1];
      profile_slug = segments[2];
    }
  }

  if (profile_slug && agent_id) {
    webflow_domain = process.env.NEXT_PUBLIC_DEFAULT_THEME_DOMAIN as string;
    const agent_record = await findAgentRecordByAgentId(agent_id);
    const metatags = {
      ...agent_record?.agent_metatag?.data?.attributes,
    };

    if (agent_record) {
      // If agent does not have any webflow_domain assigned yet, use the default theme
      webflow_domain = agent_record.webflow_domain || process.env.NEXT_PUBLIC_DEFAULT_THEME_DOMAIN;
      if (page_route.length) pathname = `/${page_route.join('/') || ''}`;
      agent_data = {
        ...agent_record,
      };
      if (!agent_data || !metatags.profile_slug || metatags.profile_slug !== profile_slug) return <NotFound></NotFound>;
    } else {
      return <NotFound></NotFound>;
    }
  }

  // if (!agent_data) {
  // If we have a 404 - uncomment this and update...
  // const req_page_html = await axios.get(`https://${process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN}`);
  // data = req_page_html.data;
  // data = '<html><head></head><body></body></html>';

  // return <NotFound>404</NotFound>;
  // }

  if (theme && searchParams.paragon) {
    if (['/ai', '/ai-result'].includes(pathname)) {
      webflow_domain = 'leagent-website.webflow.io';
    } else if (theme === 'default') {
      webflow_domain = `${process.env.NEXT_PUBLIC_DEFAULT_THEME_DOMAIN}`;
    } else {
      webflow_domain = `${searchParams.theme}-leagent.webflow.io`;
    }
    const agent_record = await findAgentRecordByAgentId(searchParams.agent);
    if (agent_record?.agent_id) {
      agent_data = {
        ...agent_data,
        ...agent_record,
        webflow_domain,
      };
    }
  } else if (agent_data?.webflow_domain) {
    webflow_domain = agent_data.webflow_domain;
  }

  page_url = `https://${webflow_domain}${['/property', '/preview'].includes(pathname) ? '/property/propertyid' : pathname}`;

  try {
    console.log('Load into layout:', { pathname, page_url });
    const req_page_html = await axios.get(page_url);
    data = req_page_html.data;
  } catch (e) {
    console.log('Layout.tsx ERROR.  Unable to fetch page html for', page_url);
  }

  let property;
  let cache_found = false;
  if (['/property', '/preview'].includes(requestUrl.pathname) && searchParams && (searchParams.lid || searchParams.id || searchParams.mls)) {
    if (searchParams.lid) {
      property = await getPrivatePropertyData(searchParams.lid);
    } else {
      // Publicly listed property page
      const start = new Date().getTime();
      console.log('');
      console.log('');
      console.log('---');
      console.log('Started', start);
      if (searchParams.mls) {
        try {
          const cached_property = await axios.get(`${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${searchParams.mls}/recent.json`);
          const cached_legacy = await axios.get(`${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${searchParams.mls}/legacy.json`);
          property = cached_property?.data || undefined;
          cache_found = true;
        } catch (e) {
          console.log('No cached file');
        }
      }
      if (!property) property = await getPropertyData(searchParams.id || searchParams.mls, !!searchParams.mls);
      const end = new Date().getTime();
      console.log('Ended', end);
      console.log('Total', end - start);
      console.log('---');
      console.log('');
      console.log('');
      console.log('');
    }
  }

  if (typeof data !== 'string') {
    data = '<html><head></head><body></body></html>';
  }

  const $: CheerioAPI = load(
    `${data}`.split('</title>').join(`</title>
  <link rel='canonical' href='${requestUrl.origin}${requestUrl.pathname}' />`),
  );

  const webflow: WebFlow = {
    head: {
      props: {
        ...$('html').attr(),
      },
      code: $('head').html() || '',
    },
    body: {
      code: $('body').html() || '',
      props: $('body').attr() || {},
    },
  };

  // To fix the issue with HMR on leagent-website, I needed to extract each
  // element in the <head> section and rexify them below
  const head_links = $('head link');
  const head_meta = $('head meta');
  const metas: React.ReactElement[] = [];

  head_meta.toArray().map(meta => {
    metas.push(<meta {...attributesToProps(meta.attribs)} key={meta.attribs.property || meta.attribs.name} />);
  });

  head_links.toArray().map(meta => {
    let page_key = new URL(meta.attribs.href).pathname;
    if (new URL(meta.attribs.href).pathname.length < 2) {
      page_key = new URL(meta.attribs.href).hostname;
    }
    metas.push(<link {...attributesToProps(meta.attribs)} key={page_key} />);
  });
  console.log('Loading meta');
  // end of extracting and assigning <head> elements
  const { class: bodyClassName, ...body_props } = webflow.body.props;
  if (!agent_data || webflow_domain === process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN || requestUrl.pathname.split('/').pop() === 'map') {
    return (
      <html data-wf-domain={`${process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN}`} {...$('html').attr()}>
        <head>
          <title>{$('head title').text()}</title>
          {metas}
        </head>
        {/* <head
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: webflow.head.code.split('<script').join('\n\n<!-- <script').split('/script>').join('/script> -->\n\n'),
          }}
        /> */}

        <body {...body_props} className={bodyClassName} suppressHydrationWarning>
          {children}
          {webflow.body.code && rexifyScriptsV2(webflow.body.code)}
          <script
            type='text/javascript'
            dangerouslySetInnerHTML={{
              __html: initializePlacesAutocomplete({
                apiKey: NEXT_APP_GGL_API_KEY || '',
              }),
            }}
          ></script>
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${NEXT_APP_GGL_API_KEY}&libraries=places,localContext&v=beta&callback=initializePlacesAutocomplete`}
          />
        </body>
      </html>
    );
  }
  return (
    webflow && (
      <html {...$('html').attr()}>
        {webflow.head.code ? (
          <head
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: [replaceMetaTags(webflow.head.code, agent_data, property)].join(`
              
              `),
            }}
          />
        ) : (
          ''
        )}
        {webflow.body ? (
          <body {...body_props} className={bodyClassName} suppressHydrationWarning>
            {children}
            {requestUrl.pathname && requestUrl.pathname.split('/').pop() === 'map' ? (
              <Script src='https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js' async />
            ) : (
              <></>
            )}
            <script
              type='text/javascript'
              dangerouslySetInnerHTML={{
                __html: initializePlacesAutocomplete({
                  apiKey: NEXT_APP_GGL_API_KEY || '',
                }),
              }}
            ></script>
            <script
              type='text/javascript'
              dangerouslySetInnerHTML={{
                __html: appendJs(
                  `https://maps.googleapis.com/maps/api/js?key=${NEXT_APP_GGL_API_KEY}&libraries=places,localContext&v=beta&callback=initializePlacesAutocomplete`,
                ),
              }}
            ></script>

            {webflow.body.code && rexifyScripts(webflow.body.code)}
          </body>
        ) : (
          <body>{children}</body>
        )}
      </html>
    )
  );
}
