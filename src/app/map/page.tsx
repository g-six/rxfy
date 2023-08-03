import React from 'react';
import axios from 'axios';
import { headers } from 'next/headers';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { findAgentRecordByAgentId } from '../api/agents/model';
import MapIterator from './map-iterator.module';
import { SearchHighlightInput } from '@/_typings/maps';
import { redirect } from 'next/navigation';

export default async function MapPage({ params, searchParams }: { params: { [key: string]: string }; searchParams: { [key: string]: string } }) {
  const { slug: agent_id, 'profile-slug': slug } = params;
  const url = headers().get('x-url');
  let agent;
  if (!url || !agent_id) return <>404</>;
  if (!searchParams.lat || !searchParams.lng) {
    // Redirect
    agent = await findAgentRecordByAgentId(agent_id);
    const [default_location] = agent.metatags.search_highlights?.labels || ([] as SearchHighlightInput[]);
    if (default_location?.lat && default_location?.lng) {
      const { lat, lng, title } = default_location;
      redirect(
        `/${agent_id}/${slug}/map?city=${encodeURIComponent(
          title.split(' ').join('+'),
        )}&lat=${lat}&lng=${lng}&beds=0&baths=1&minprice=500000&maxprice=20000000`,
      );
    }
  }
  let time = Date.now();
  console.log(`\n\nSSR Speed stats for ${headers().get('referer')}`);
  const promises = await Promise.all([axios.get(url) as Promise<any>].concat(slug && agent_id ? [findAgentRecordByAgentId(agent_id)] : []));

  if (url) {
    if (promises.length > 1) agent = promises.pop();

    const { data: html } = promises[0];

    if (html) {
      console.log(Date.now() - time + 'ms', '[Completed] HTML template & agent Strapi data extraction');
      const $: CheerioAPI = load(html);
      console.log(Date.now() - time + 'ms', '[Completed] HTML template load to memory');
      const body = $('body > div');
      const Page = (
        <>
          <MapIterator agent={agent} city={searchParams.city}>
            {domToReact(body as unknown as DOMNode[]) as unknown as React.ReactElement}
          </MapIterator>
        </>
      );
      console.log(Date.now() - time + 'ms', '[Completed] rexification\n\n\n');
      return Page;
    }
  }
  return <>Page url is invalid or not found, please see app/map/page</>;
}
