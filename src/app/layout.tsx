/* eslint-disable @next/next/no-css-tags */
import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';

import Script from 'next/script';

import React from 'react';
import { WEBFLOW_THEME_DOMAINS, WebFlow } from '@/_typings/webflow';
import { AgentData } from '@/_typings/agent';
import { getPropertyData } from '@/_utilities/data-helpers/property-page';
import { replaceMetaTags } from '@/_helpers/head-manipulations';
import initializePlacesAutocomplete from '@/components/Scripts/places-autocomplete';
import { rexifyScripts, rexifyScriptsV2 } from '@/components/rexifier';
import { findAgentRecordByAgentId } from './api/agents/model';
import { attributesToProps } from 'html-react-parser';
import NotFound from './not-found';
import { getPrivateListing } from './api/private-listings/model';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const axios = (await import('axios')).default;
  const { NEXT_APP_GGL_API_KEY } = process.env;
  const url = headers().get('x-url') as string;
  if (!url) return <NotFound></NotFound>;

  let { pathname } = new URL(url);
  const requestLink = headers().get('x-url') || '';
  const requestUrl = new URL(requestLink);
  const searchParams = Object.fromEntries(requestUrl.searchParams);

  // These variables will determine the page to be served along with the data to be injected
  // in the Rexification process
  let data;
  let agent_data = {
    id: 11431,
    email: 'team@leagent.com',
    phone: '(604) 330-0992',
    first_name: '',
    last_name: '',
    full_name: 'Leagent',
    agent_id: 'LEAGENT',
    metatags: {
      profile_slug: 'leagent',
      street_1: '6060 Silver Dr',
      street_2: 'Burnaby, BC V5H 2Y3',
      logo_for_light_bg: '',
      title: 'Leagent - REALTOR® AI-Powered Marketing Platform',
      description:
        'Leagent is your online office – where you collaborate on the home purchase with your clients, do market analysis, and have your marketing assets made in 10 minutes',
    },
  } as unknown as AgentData;
  let theme = searchParams.theme;
  let webflow_domain = headers().get('x-wf-domain') || process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN;
  let agent_id = headers().get('x-agent-id'); // || 'LEAGENT';
  let profile_slug = headers().get('x-profile-slug'); // || 'leagent';

  if (profile_slug && agent_id) {
    const agent_record = await findAgentRecordByAgentId(agent_id);
    const metatags = {
      ...agent_record?.agent_metatag?.data?.attributes,
    };

    if (agent_record) {
      // If agent does not have any webflow_domain assigned yet, use the default theme
      agent_data = {
        ...agent_record,
      };
      if (!agent_data || !metatags.profile_slug || metatags.profile_slug !== profile_slug)
        return <NotFound id='layout-1' className='layout-1-profile-slug'></NotFound>;
    } else {
      return <NotFound id='layout-2' className='layout invalid-profile-slug'></NotFound>;
    }
  }

  if (theme && searchParams.paragon) {
    if (theme === 'default') {
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
  }

  try {
    console.log('Request link', requestLink);
    const req_page_html = await axios.get(requestLink);
    data = req_page_html.data;
  } catch (e) {
    console.log('Layout.tsx ERROR.  Unable to fetch page html for', requestLink);
  }

  let property;
  let cache_found = false;

  if (['/property', '/preview'].includes(requestUrl.pathname) && searchParams && (searchParams.lid || searchParams.id || searchParams.mls)) {
    if (searchParams.lid) {
      // property = await getPrivatePropertyData(searchParams.lid);
      property = await getPrivateListing(Number(searchParams.lid));
    } else {
      // Publicly listed property page
      if (searchParams.mls) {
        try {
          const cached_property = await axios.get(`${process.env.NEXT_PUBLIC_LISTINGS_CACHE}/${searchParams.mls}/recent.json`);
          property = cached_property?.data || undefined;
          cache_found = true;
        } catch (e) {
          console.log('No cached file');
        }
      }
      if (!property) property = await getPropertyData(searchParams.id || searchParams.mls, !!searchParams.mls);
    }
  }

  if (typeof data !== 'string') {
    data = '<html><head></head><body></body></html>';
  }
  const header_list = headers();
  const $: CheerioAPI = load(
    `${data}`.split('</title>').join(`</title>
  <link rel='canonical' href='${header_list.get('referer') || header_list.get('x-canonical')}' />`),
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
  const metas: React.ReactElement[] = [
    <title key='title'>{header_list.get('x-page-title') || agent_data?.metatags?.title || $('title').text() || 'Leagent'}</title>,
    <meta
      key='site-description'
      name='description'
      content={header_list.get('x-page-description') || agent_data?.metatags?.description || $('title').text() || 'Leagent'}
    />,
    <link key='preflight-css' rel='stylesheet' type='text/css' href='/css/preflight.css' />,
    <link key='mapbox-css' rel='stylesheet' type='text/css' href='https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.css' />,
  ];

  head_meta.toArray().map(meta => {
    metas.push(<meta {...attributesToProps(meta.attribs)} key={meta.attribs.property || meta.attribs.name} />);
  });

  head_links
    .toArray()
    .filter(meta => meta.attribs.rel !== 'canonical')
    .map(meta => {
      let page_key = new URL(meta.attribs.href).pathname;
      if (new URL(meta.attribs.href).pathname.length < 2) {
        page_key = new URL(meta.attribs.href).hostname;
      }
      metas.push(<link {...attributesToProps(meta.attribs)} key={page_key} />);
    });
  // end of extracting and assigning <head> elements

  const { class: bodyClassName, ...body_props } = webflow.body.props;
  let use_v2 = webflow_domain === process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN;
  if (!use_v2) use_v2 = webflow_domain === WEBFLOW_THEME_DOMAINS.ALICANTE;

  if (use_v2 || requestUrl.pathname.split('/').pop() === 'map' || requestUrl.pathname.split('/').pop() === 'propertyid.html') {
    const html_props = {
      ...$('html').attr(),
      class: undefined,
    };

    return (
      <html data-wf-domain={`${process.env.NEXT_PUBLIC_LEAGENT_WEBFLOW_DOMAIN}`} {...html_props}>
        <head>{metas.filter(m => m.key)}</head>

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

  console.log('Loading alternate html for', webflow_domain, requestUrl.pathname);
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
            <Script
              src={`https://maps.googleapis.com/maps/api/js?key=${NEXT_APP_GGL_API_KEY}&libraries=places,localContext&v=beta&callback=initializePlacesAutocomplete`}
            />
            <script
              type='text/javascript'
              dangerouslySetInnerHTML={{
                __html: initializePlacesAutocomplete({
                  apiKey: NEXT_APP_GGL_API_KEY || '',
                }),
              }}
            ></script>

            {webflow.body.code && pathname.indexOf('pdf') === -1 && rexifyScripts(webflow.body.code)}
          </body>
        ) : (
          <body>{children}</body>
        )}
      </html>
    )
  );
}
