import axios from 'axios';
import { ReactElement } from 'react';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { must_not } from '@/_utilities/api-calls/call-legacy-search';
import FooterIterator from '@/components/RxFooter';
import RxNotifications from '@/components/RxNotifications';
import { LOGO_FIELDS } from '@/_constants/agent-fields';
import { getAgentMapDefaultUrl } from '@/_utilities/data-helpers/agent-helper';
import { findAgentBrokerageAgents, findAgentRecordByAgentId } from '@/app/api/agents/model';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import Iterator from './page-iterator.module';
import NavIterator from '@/components/Nav/RxNavIterator';
import { PropertyDataModel } from '@/_typings/property';
import { headers } from 'next/headers';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { getPipelineData } from '@/app/api/pipeline/subroutines';
import { getAgentBaseUrl } from '@/app/api/_helpers/agent-helper';

export default async function PageComponent({
  agent_id,
  theme = 'default',
  ...props
}: {
  agent_id: string;
  theme?: string;
  'page-url'?: string;
  searchParams?: { [k: string]: string };
}) {
  console.log('');
  console.log('');
  console.log('* * * [slug]/[profile-slug]/page.module.tsx * * *');
  console.log('Loading app/[slug]/[profile-slug]/page.module.tsx', { slug: agent_id });
  const agent = await findAgentRecordByAgentId(agent_id);
  const brokers = await findAgentBrokerageAgents(agent_id, true);

  const webflow_site = props['page-url'] || (headers().get('x-url') as string);

  const promises = await Promise.all([axios.get(webflow_site)]);
  const { data: html } = promises[0];
  const $: CheerioAPI = load(html);
  let filter = [] as unknown[];
  let should = [
    {
      match: {
        'data.LA1_LoginName': agent_id,
      },
    },
    {
      match: {
        'data.LA2_LoginName': agent_id,
      },
    },
    {
      match: {
        'data.LA3_LoginName': agent_id,
      },
    },
  ] as unknown[];
  (brokers as unknown as string[]).forEach(co_agent_id => {
    should.push({
      match: {
        'data.LA1_LoginName': co_agent_id,
      },
    });
    should.push({
      match: {
        'data.LA2_LoginName': co_agent_id,
      },
    });
    should.push({
      match: {
        'data.LA3_LoginName': co_agent_id,
      },
    });
  });

  const { pathname } = new URL(headers().get('x-url') as string);
  const file_name = pathname.split('/').pop() as string;
  const page_slug = file_name.split('.html').join('');
  const area = capitalizeFirstLetter(page_slug.split('-').join(' '));

  if (agent.metatags?.search_highlights?.labels) {
    const { labels } = agent.metatags.search_highlights as unknown as {
      labels: {
        ne: {
          lat: number;
          lng: number;
        };
        sw: {
          lat: number;
          lng: number;
        };
        title: string;
      }[];
    };
    if (labels.length) {
      let max_lat = -999,
        min_lat = -999,
        max_lng = -999,
        min_lng = -999;
      if (!area || ['Homepage', 'Index', 'Properties'].includes(area)) {
        labels.forEach(l => {
          should = should.concat([
            {
              match: { 'data.Area': l.title },
            },
          ]);
          if (max_lat === -999 || max_lat < l.ne.lat) {
            max_lat = l.ne.lat;
          }
          if (max_lng === -999 || max_lng < l.ne.lng) {
            max_lng = l.ne.lng;
          }
          if (min_lat === -999 || min_lat > l.sw.lat) {
            min_lat = l.sw.lat;
          }
          if (min_lng === -999 || min_lng > l.sw.lng) {
            min_lng = l.sw.lng;
          }
        });
        filter = filter.concat([
          {
            range: {
              'data.lat': {
                lte: max_lat,
                gte: min_lat,
              },
            },
          },
          {
            range: {
              'data.lng': {
                lte: max_lng,
                gte: min_lng,
              },
            },
          },
        ]);
      } else {
        filter.push({
          match: {
            'data.Area': area,
          },
        });
      }
    }
  }

  $('[data-field="agent_name"]').each((i, el) => {
    $(el).text(agent.full_name);
  });

  LOGO_FIELDS.forEach(logo_field => {
    $(`[data-field="${logo_field}"]`).each((i, el) => {
      const attribs = Object.keys(el.attribs).map(attr => {
        let val = el.attribs[attr];
        if (attr === 'src' && LOGO_FIELDS.includes(logo_field) && agent.metatags?.[logo_field]) {
          return `src="${getImageSized(agent.metatags[logo_field], 160)}"`;
        }
        return `${attr}="${val}"`;
      });
      if (!el.attribs.src) $(el).replaceWith(`<${el.tagName} ${attribs.join(' ')}>${agent.full_name}</${el.tagName}>`);
    });
  });

  $('a[href]').each((i, el) => {
    if (el.attribs.href.indexOf('/') === 0) {
      const attribs = Object.keys(el.attribs).map(attr => {
        let val = el.attribs[attr];
        if (attr === 'href') {
          if (val === '/map') return `${attr}=${getAgentMapDefaultUrl(agent)}`;
          else return `${attr}=${getAgentBaseUrl(agent)}${val}`;
        }
        if (attr === 'style') {
          val = val.split('"').join('');
          val = val.split("'").join('');
        }
        return `${attr}="${val}"`;
      });
      $(el).replaceWith(`<a ${attribs.join(' ')}>${$(el).html()}</a>`);
    }
  });
  const is_homepage = headers().get('x-url')?.split('/').pop() === 'index.html';
  if (is_homepage) {
    filter.push({
      match: {
        'data.PropertyType': 'Residential Detached',
      },
    });
  }
  const minimum_should_match = brokers.length === 0 && should.length >= 3 ? should.length - 2 : 1;

  const internal_req = {
    from: 0,
    size: is_homepage ? 3 : 60,
    sort: is_homepage
      ? {
          'data.AskingPrice': 'desc',
        }
      : {
          'data.UpdateDate': 'desc',
        },
    query: {
      bool: {
        filter: filter.concat([
          {
            match: {
              'data.Status': 'Active',
            },
          },
        ]),
        should,
        minimum_should_match,
        must_not,
      },
    },
  } as LegacySearchPayload;
  const intsold_req = {
    from: 0,
    size: 45,
    sort: {
      'data.UpdateDate': 'desc',
    },
    query: {
      bool: {
        filter: filter.concat([
          {
            match: {
              'data.Status': 'Sold',
            },
          },
        ]),
        should,
        minimum_should_match: brokers.length === 0 && should.length >= 3 ? should.length - 2 : 1,
        must_not,
      },
    },
  } as LegacySearchPayload;

  const [{ records: active }, { records: sold }] = await Promise.all([getPipelineData(internal_req), getPipelineData(intsold_req)]);

  $('[data-field="search_highlights"]:not(:first-child)').remove();
  $('.property-card:not(:first-child)').remove();
  $('[data-group="sold_listings"] [data-component="property_card"]:not(:first-child)').remove();

  if (sold) {
    const listings = sold as PropertyDataModel[];
    if (listings.length === 0) $('[data-group="sold_listings"]').remove();
  }

  const navbar = $('body .navbar-component');
  $('body .navbar-component').remove();

  const footer = $('[data-group="footer"]');

  const body = $('body > div');
  if (props.searchParams?.theme) {
    body.addClass('ai-preview');
  }

  return (
    <>
      <NavIterator agent={agent}>{domToReact(navbar as unknown as DOMNode[]) as unknown as ReactElement}</NavIterator>
      <Iterator
        agent={agent}
        listings={{
          active: (active || []) as unknown[] as PropertyDataModel[],
          sold: (sold || []) as unknown[] as PropertyDataModel[],
        }}
      >
        {domToReact(body as unknown as DOMNode[]) as unknown as ReactElement}
      </Iterator>

      <FooterIterator agent={agent}>{domToReact(footer as unknown as DOMNode[]) as unknown as ReactElement}</FooterIterator>
      <RxNotifications />
    </>
  );
}
