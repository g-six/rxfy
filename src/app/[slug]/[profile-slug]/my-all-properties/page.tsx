import React from 'react';
import axios from 'axios';
import { cookies, headers } from 'next/headers';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import MapIterator from '@/app/map/map-iterator.module';
import { SearchHighlightInput } from '@/_typings/maps';
import { redirect } from 'next/navigation';
import RxNotifications from '@/components/RxNotifications';
import { getLovedHomes } from '@/app/api/loves/model';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { getBounds } from '@/_utilities/map-helper';
import { must_not } from '@/_utilities/api-calls/call-legacy-search';
import { NextRequest } from 'next/server';
import { PropertyDataModel } from '@/_typings/property';
import NavIterator from '@/components/Nav/RxNavIterator';
import { getPipelineData } from '@/app/api/pipeline/subroutines';

interface SearchOpts {
  nelat: number;
  nelng: number;
  swlat: number;
  swlng: number;
  baths?: number;
  beds?: number;
  year_built?: number;
  minsqft?: number;
  maxsqft?: number;
  minprice?: number;
  maxprice?: number;
  ptypes?: string[];
  keywords?: string[];
  sort: {
    [key: string]: 'asc' | 'desc';
  };
}

export default async function MyAllProperties({ params, searchParams }: { params: { [key: string]: string }; searchParams: { [key: string]: string } }) {
  const { slug: agent_id, 'profile-slug': slug } = params;
  const url = headers().get('x-url');
  let agent = await findAgentRecordByAgentId(agent_id);
  if (!url || !agent_id) return <>404</>;

  if (!searchParams.lat || !searchParams.lng) {
    // Redirect
    const [default_location] = agent.metatags.search_highlights?.labels || ([] as SearchHighlightInput[]);
    if (default_location?.lat && default_location?.lng) {
      const { lat, lng, title } = default_location;
      if (agent.webflow_domain?.includes('leagent'))
        redirect(
          `/${agent_id}/${slug}/my-all-properties?city=${encodeURIComponent(
            title.split(' ').join('+'),
          )}&lat=${lat}&lng=${lng}&beds=0&baths=1&minprice=500000&maxprice=20000000`,
        );
      else
        redirect(
          `/my-all-properties?city=${encodeURIComponent(title.split(' ').join('+'))}&lat=${lat}&lng=${lng}&beds=0&baths=1&minprice=500000&maxprice=20000000`,
        );
    }
  } else {
  }

  console.log(`\n\nSSR Speed stats for ${headers().get('referer')}`);
  let time = Date.now();

  const session_key = cookies().get('session_key')?.value || '';
  const session_as = cookies().get('session_as')?.value || '';
  let loves: any[] = [];
  if (session_key && session_as === 'customer') {
    const customer_id = Number(session_key.split('-').pop());
    if (!isNaN(customer_id)) {
      loves = await getLovedHomes(customer_id);
      console.log(Date.now() - time + 'ms', '[Completed] Love data');
    }
  }
  const center = getBounds(Number(searchParams.lat), Number(searchParams.lng), 5) as unknown as SearchOpts;
  const upper = getBounds((center.nelat + Number(searchParams.lat)) / 2, center.nelng / 2, 3) as unknown as SearchOpts;
  const lower = getBounds((center.swlat + Number(searchParams.lat)) / 2, center.swlng / 2, 3) as unknown as SearchOpts;
  const promises = await Promise.all(
    [
      axios.get(url) as Promise<any>,
      getPipelineData(
        generatePipelineParams({
          ...center,
          ...searchParams,
        }),
      ),
      getPipelineData(
        generatePipelineParams({
          ...upper,
          ...searchParams,
        }),
      ),
      getPipelineData(
        generatePipelineParams({
          ...lower,
          ...searchParams,
        }),
      ),
    ].concat(slug && agent_id ? [findAgentRecordByAgentId(agent_id)] : []),
  );

  if (url) {
    if (promises.length > 4) agent = promises.pop();

    const { data: html } = promises[0];

    let mls_included: string[] = [];
    let properties: PropertyDataModel[] = promises[1].records
      .concat(promises[2].records)
      .concat(promises[3].records)
      .forEach((property: PropertyDataModel) => {
        if (!mls_included.includes(property.mls_id)) {
          mls_included.push(property.mls_id);
          properties.push(property);
        }
      });

    if (html) {
      console.log(Date.now() - time + 'ms', '[Completed] HTML template & agent Strapi data extraction');
      const $: CheerioAPI = load(html);
      const nav = $('body .navbar---dashboard');
      $('body .navbar---dashboard').remove();
      const body = $('body > div');
      const Page = (
        <>
          {agent.webflow_domain?.includes('leagent') ? (
            <NavIterator agent={agent}>{domToReact(nav as unknown as DOMNode[]) as unknown as React.ReactElement}</NavIterator>
          ) : (
            domToReact(nav as unknown as DOMNode[])
          )}
          <MapIterator agent={agent} city={searchParams.city} loves={loves} properties={properties}>
            {domToReact(body as unknown as DOMNode[]) as unknown as React.ReactElement}
          </MapIterator>

          <RxNotifications />
        </>
      );
      console.log(Date.now() - time + 'ms', '[Completed] rexification\n\n\n');
      return Page;
    }
  }
  return <>Page url is invalid or not found, please see app/map/page</>;
}

function generatePipelineParams(opts: SearchOpts, size = 100) {
  let minimum_should_match = 1;
  const user_defined_filters: {
    range?: {
      [k: string]: {
        gte?: number;
        lte?: number;
      };
    };
    term?: {
      [k: string]: string;
    };
    match?: {
      [k: string]: string;
    };
  }[] = [];

  if (opts.baths) {
    user_defined_filters.push({
      range: {
        'data.L_TotalBaths': {
          gte: Number(opts.baths),
        },
      },
    });
  }
  if (opts.beds) {
    user_defined_filters.push({
      range: {
        'data.L_BedroomTotal': {
          gte: Number(opts.beds),
        },
      },
    });
  }
  if (opts.minprice && opts.maxprice) {
    user_defined_filters.push({
      range: {
        'data.AskingPrice': {
          gte: Number(opts.minprice),
          lte: Number(opts.maxprice),
        },
      },
    });
  } else if (opts.minprice) {
    user_defined_filters.push({
      range: {
        'data.AskingPrice': {
          gte: Number(opts.minprice),
        },
      },
    });
  } else if (opts.maxprice) {
    user_defined_filters.push({
      range: {
        'data.AskingPrice': {
          lte: Number(opts.maxprice),
        },
      },
    });
  }

  let should: {
    match?: {
      [k: string]: string;
    };
  }[] = [];

  if (opts.ptypes) {
    should = `${opts.ptypes}`.split(',').map(t => ({
      match: {
        'data.Type': t === 'House' ? 'House/Single Family' : t,
      },
    }));
  }

  const legacy_params: LegacySearchPayload = {
    from: 0,
    size,
    sort: opts.sort || { 'data.UpdateDate': 'desc' },
    query: {
      bool: {
        filter: [
          {
            range: {
              'data.lat': {
                lte: opts.nelat,
                gte: opts.swlat,
              },
            },
          },
          {
            range: {
              'data.lng': {
                lte: opts.nelng,
                gte: opts.swlng,
              },
            },
          },
          {
            match: {
              'data.IdxInclude': 'Yes',
            },
          },
          {
            match: {
              'data.Status': 'Active' as string,
            },
          } as unknown as Record<string, string>,
        ].concat(user_defined_filters as any[]) as any[],
        should,
        ...(should.length ? { minimum_should_match } : {}),
        must_not,
      },
    },
  };

  return legacy_params;
}
