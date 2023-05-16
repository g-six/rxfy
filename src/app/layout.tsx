import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';

import Script from 'next/script';

import './globals.css';
import React from 'react';
import { WebFlow } from '@/_typings/webflow';
import { AgentData } from '@/_typings/agent';
import { getAgentDataFromDomain } from '@/_utilities/data-helpers/agent-helper';
import { getPrivatePropertyData, getPropertyData } from '@/_utilities/data-helpers/property-page';
import { replaceMetaTags } from '@/_helpers/head-manipulations';
import initializePlacesAutocomplete from '@/components/Scripts/places-autocomplete';

const skip_pathnames = ['/favicon.ico'];

function getFullWebflowPagePath(pathname: string) {
  if (!pathname || pathname === '/' || skip_pathnames.includes(pathname)) return '/';
  if (pathname === '/property') return '/property/propertyid';
  return pathname;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const axios = (await import('axios')).default;
  const { NEXT_APP_GGL_API_KEY, TEST_DOMAIN } = process.env;
  const url = headers().get('x-url') as string;

  const { hostname, pathname } = new URL(url);

  const agent_data: AgentData = await getAgentDataFromDomain(hostname === 'localhost' ? `${TEST_DOMAIN}` : hostname);
  let data;
  const page_url = `https://${agent_data.webflow_domain}${getFullWebflowPagePath(pathname)}`;
  try {
    const req_page_html = await axios.get(page_url);
    data = req_page_html.data;
  } catch (e) {
    console.log('Layout.tsx ERROR.  Unable to fetch page html for', page_url);
  }

  console.log('Webflow domain', page_url);

  const requestLink = headers().get('x-url') || '';
  const requestUrl = new URL(requestLink);
  const searchParams = Object.fromEntries(requestUrl.searchParams);
  let property;
  let cache_found = false;
  if (requestUrl.pathname === '/property' && searchParams && (searchParams.lid || searchParams.id || searchParams.mls)) {
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
          const cached_property = await axios.get(`${process.env.NEXT_APP_LISTINGS_CACHE}/${searchParams.mls}/recent.json`);
          const cached_legacy = await axios.get(`${process.env.NEXT_APP_LISTINGS_CACHE}/${searchParams.mls}/legacy.json`);
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

  const $: CheerioAPI = load(data);

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

  const { class: className, ...head_props } = webflow.head.props;
  const { class: bodyClassName, ...body_props } = webflow.body.props;

  return (
    webflow && (
      <html {...head_props} className={className}>
        {webflow.head.code ? (
          <head
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: [
                `${replaceMetaTags(webflow.head.code, agent_data, property)} <script>${initializePlacesAutocomplete({
                  apiKey: NEXT_APP_GGL_API_KEY || '',
                })}</script>`,
                `<script type="text/javascript" defer src="https://maps.googleapis.com/maps/api/js?key=${NEXT_APP_GGL_API_KEY}&libraries=places,localContext&v=beta&callback=initializePlacesAutocomplete"></script>`,
                !cache_found && searchParams.mls
                  ? `<script>setTimeout(() => {
                  fetch("/api/properties?mls_id=${searchParams.mls}").then(console.log)
                }, 10000)</script>`
                  : '',
              ].join(`
              
              `),
            }}
          />
        ) : (
          ''
        )}
        {webflow.body ? (
          <body {...body_props} className={bodyClassName} suppressHydrationWarning>
            {children}
            {requestUrl.pathname !== '/' ? <Script src='https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js' async /> : <></>}
          </body>
        ) : (
          <body>{children}</body>
        )}
      </html>
    )
  );
}
