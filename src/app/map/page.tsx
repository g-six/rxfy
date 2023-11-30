import React from 'react';
import axios from 'axios';
import { cookies, headers } from 'next/headers';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import MapIterator from './map-iterator.module';
import RxNotifications from '@/components/RxNotifications';
import { getLovedHomes } from '../api/loves/model';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { must_not } from '@/_utilities/api-calls/call-legacy-search';
import { PropertyDataModel } from '@/_typings/property';
import { getPipelineData } from '../api/pipeline/subroutines';
import { queryStringToObject } from '@/_utilities/url-helper';
import { AgentData } from '@/_typings/agent';
import { Metadata } from 'next';
import { AuthPopup } from './auth.popup';
import { findAgentBrokerageAgents } from '../api/agents/model';
type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

interface SearchOpts {
  nelat?: number;
  nelng?: number;
  swlat?: number;
  swlng?: number;
  baths?: number;
  beds?: number;
  year_built?: number;
  minsqft?: number;
  maxsqft?: number;
  minprice?: number;
  maxprice?: number;
  ptypes?: string[];
  keywords?: string[];
  agent_id?: string;
  brokers?: string[];
  sort?: {
    [key: string]: 'asc' | 'desc';
  };
}

async function getMetadata(props?: Props): Promise<Metadata> {
  let page_data: {
    [k: string]: any;
  } = {};
  headers().forEach((value, key) => {
    /**
     * GREY Area
     * > Uncomment commented (//) code below to debug
     */
    // console.log({ key, value });

    const field = key.substring(2);
    if (value) {
      if (field === 'agent-id') {
        page_data = {
          ...page_data,
          agent_id: value,
        };
      } else if (field.indexOf('agent-') === 0 || field.indexOf('page-') === 0) {
        page_data = {
          ...page_data,
          [field.split('-').slice(1).join('_')]: value,
        };
      } else if (field === 'record-id' && !isNaN(Number(value))) {
        page_data = {
          ...page_data,
          id: Number(value),
        };
      } else if (field === 'metatag-id' && !isNaN(Number(value))) {
        console.log(page_data);
        page_data = {
          ...page_data,
          metatags: {
            ...page_data.metatags,
            id: Number(value),
          },
        };
      } else if (field.includes('bg-logo')) {
        page_data = {
          ...page_data,
          metatags: {
            ...page_data.metatags,
            [`logo_for_${field.split('-')[0]}_bg`]: value,
          },
        };
      } else if (field === 'wf-domain') {
        page_data = {
          ...page_data,
          webflow_domain: value,
        };
      } else if (field === 'map-uri' && value) {
        page_data = {
          ...page_data,
          metatags: {
            ...page_data.metatags,
            geocoding: queryStringToObject(value.split('?').pop() as string),
          },
        };
      }
      page_data = {
        ...page_data,
        full_name: page_data.name || 'Leagent',
      };
    }
  });

  /**
   * GREY Area
   * > Uncomment commented (//) code below to debug
   */
  // console.log(page_data);

  return page_data;
}

export default async function MapPage({ params, searchParams }: { params: { [key: string]: string }; searchParams: { [key: string]: string } }) {
  const { 'profile-slug': slug } = params;
  const url = headers().get('x-url');

  const metadata = await getMetadata();
  const page_data = metadata as unknown as AgentData;

  console.log(`\n\nSSR Speed stats for ${headers().get('x-url')}`);
  console.log(`\n\n   query: ${headers().get('x-search-params')}`);

  let time = Date.now();

  const session_key = cookies().get('session_key')?.value || '';
  const session_as = cookies().get('session_as')?.value || '';

  let loves: any[] = [];
  let customer_id = 0;
  if (session_key && session_as === 'customer') {
    customer_id = Number(session_key.split('-').pop());
    if (isNaN(customer_id)) {
      customer_id = 0;
    }
  }

  if (url) {
    const promises: any[] = await Promise.all([
      ...(customer_id ? [getLovedHomes(customer_id)] : []),
      findAgentBrokerageAgents(page_data.agent_id, true),
      getPipelineData(
        generatePipelineParams(
          {
            agent_id: page_data.agent_id,
          },
          1,
        ),
      ),
      axios.get(url),
    ]);
    if (customer_id) {
      loves = promises[0];
      loves = await getLovedHomes(customer_id);
      console.log(Date.now() - time + 'ms', '[Completed] Love data');
    }

    const { data: html } = promises.pop();
    const hits: { records?: PropertyDataModel[] } = promises.pop();
    const brokers = promises.pop();

    if (html) {
      console.log(Date.now() - time + 'ms', '[Completed] HTML template & agent Strapi data extraction');
      const $: CheerioAPI = load(html);
      console.log(Date.now() - time + 'ms', '[Completed] HTML template load to memory');

      const body = $('body > div');
      const Page = (
        <>
          <MapIterator
            agent={page_data as unknown as AgentData}
            city={searchParams.city}
            loves={loves}
            other-brokers={brokers || []}
            properties={hits?.records || []}
          >
            {domToReact(body as unknown as DOMNode[]) as unknown as React.ReactElement}
          </MapIterator>
          <RxNotifications />
          <AuthPopup />
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

  if (opts.agent_id) {
    should.push({
      match: {
        'data.LA1_LoginName': opts.agent_id,
      },
    });
    should.push({
      match: {
        'data.LA2_LoginName': opts.agent_id,
      },
    });
    should.push({
      match: {
        'data.LA3_LoginName': opts.agent_id,
      },
    });
  }
  if (opts.brokers?.length) {
    opts.brokers.forEach(agent_id => {
      should.push({
        match: {
          'data.LA1_LoginName': agent_id,
        },
      });
      should.push({
        match: {
          'data.LA2_LoginName': agent_id,
        },
      });
      should.push({
        match: {
          'data.LA3_LoginName': agent_id,
        },
      });
    });
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
