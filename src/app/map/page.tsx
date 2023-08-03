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
      const { lat, lng } = default_location;
      redirect(`/${agent_id}/${slug}/map?lat=${lat}&lng=${lng}`);
    }
  }
  let time = Date.now();
  console.log(`\n\nSSR Speed stats for ${headers().get('referer')}`);
  const promises = await Promise.all([axios.get(url) as Promise<any>].concat(slug && agent_id ? [findAgentRecordByAgentId(agent_id)] : []));

  if (url) {
    let northeast: { lat: number; lng: number } | undefined = undefined,
      southwest: { lat: number; lng: number } | undefined = undefined,
      lat,
      lng;
    if (promises.length > 1) agent = promises.pop();
    if (agent?.metatags) {
      const locations = (agent.metatags.search_highlights?.labels || []) as unknown as {
        lat: number;
        lng: number;
        ne: {
          lat: number;
          lng: number;
        };
        sw: {
          lat: number;
          lng: number;
        };
      }[];
      let total_lat = 0;
      let total_lng = 0;
      if (locations.length) {
        locations.map(location => {
          total_lat += location.lat;
          total_lng += location.lng;
          if (northeast === undefined) {
            northeast = location.ne;
          } else {
            if (location.ne.lat > northeast.lat) {
              northeast.lat = location.ne.lat;
            }
            if (location.ne.lng > northeast.lng) {
              northeast.lng = location.ne.lng;
            }
          }
          if (southwest === undefined) {
            southwest = {
              lat: location.sw.lat,
              lng: location.sw.lng,
            };
          } else {
            if (location.sw.lat < southwest.lat) {
              southwest.lat = location.sw.lat;
            }
            if (location.sw.lng > southwest.lng) {
              southwest.lng = location.sw.lng;
            }
          }
        });
        lat = total_lat / locations.length;
        lng = total_lng / locations.length;
        if (northeast !== undefined && southwest !== undefined) {
          northeast = northeast as unknown as {
            lat: number;
            lng: number;
          };
          southwest = southwest as unknown as {
            lat: number;
            lng: number;
          };
        }
      }
    }

    const { data: html } = promises[0];

    if (html) {
      console.log(Date.now() - time + 'ms', '[Completed] HTML template & agent Strapi data extraction');
      const $: CheerioAPI = load(html);
      console.log(Date.now() - time + 'ms', '[Completed] HTML template load to memory');
      const body = $('body > div');
      const Page = (
        <>
          <MapIterator agent={agent} city={searchParams.city} ne={northeast} sw={southwest}>
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
