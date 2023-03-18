import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';

import './globals.css';
import React from 'react';
import { WebFlow } from '@/_typings/webflow';
import Script from 'next/script';
import initializePlacesAutocomplete from '@/components/Scripts/places-autocomplete';

export const metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const axios = (await import('axios')).default;
  const { TEST_DOMAIN, NEXT_APP_GOOGLE_API_KEY } = process.env;
  const url = TEST_DOMAIN || headers().get('origin') || '';

  const { origin, pathname } = new URL(url);
  console.log('layout.axios', `${origin}${pathname && pathname}`);
  const { data } = await axios.get(
    `${origin}${pathname && pathname}`
  );

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
  const { class: bodyClassName, ...body_props } =
    webflow.body.props;

  return (
    webflow && (
      <html {...head_props} className={className}>
        {webflow.head.code ? (
          <head
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: webflow.head.code }}
          />
        ) : (
          ''
        )}
        {webflow.body ? (
          <body
            {...body_props}
            className={bodyClassName}
            suppressHydrationWarning
          >
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
            <Script
              src='https://api.mapbox.com/mapbox-gl-js/v2.13.0/mapbox-gl.js'
              async
            />
          </body>
        ) : (
          <body>{children}</body>
        )}
      </html>
    )
  );
}
