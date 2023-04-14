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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const axios = (await import('axios')).default;
  const { NEXT_APP_GOOGLE_API_KEY } = process.env;
  const url = headers().get('x-url') as string;

  const { hostname, pathname } = new URL(url);

  console.log('');
  console.log('----- Layout source for----');
  console.log({ hostname });
  console.log('--------------------\n\n');

  const agent_data: AgentData = await getAgentDataFromDomain(hostname === 'localhost' ? 'rx.leagent.com' : hostname);

  const { data } = await axios.get(`https://${agent_data.webflow_domain}${pathname && pathname}`);

  const requestLink = headers().get('x-url') || '';
  const requestUrl = new URL(requestLink);
  const searchParams = Object.fromEntries(requestUrl.searchParams);
  let property;
  if (requestUrl.pathname === '/property' && searchParams && (searchParams.lid || searchParams.id || searchParams.mls)) {
    if (searchParams.lid) {
      property = await getPrivatePropertyData(searchParams.lid);
    } else {
      // Publicly listed property page
      property = await getPropertyData(searchParams.id || searchParams.mls, !!searchParams.mls);
    }
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
          <head suppressHydrationWarning dangerouslySetInnerHTML={{ __html: replaceMetaTags(webflow.head.code, agent_data, property) }} />
        ) : (
          // <head suppressHydrationWarning dangerouslySetInnerHTML={{ __html: webflow.head.code }} />
          ''
          // <head suppressHydrationWarning dangerouslySetInnerHTML={{ __html: webflow.head.code }} />
        )}
        {webflow.body ? (
          <body {...body_props} className={bodyClassName} suppressHydrationWarning>
            {children}
            <Script
              async
              suppressHydrationWarning
              id='google-map-init'
              dangerouslySetInnerHTML={{
                __html: initializePlacesAutocomplete({
                  apiKey: NEXT_APP_GOOGLE_API_KEY || '',
                }),
              }}
            />
            <Script
              src={`https://maps.googleapis.com/maps/api/js?key=${NEXT_APP_GOOGLE_API_KEY}&libraries=places,localContext&v=beta&callback=initializePlacesAutocomplete`}
              async
            />
            <Script src='https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js' async />
          </body>
        ) : (
          <body>{children}</body>
        )}
      </html>
    )
  );
}
