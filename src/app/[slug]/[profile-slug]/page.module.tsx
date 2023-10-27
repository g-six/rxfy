import axios from 'axios';
import { ReactElement } from 'react';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { NextRequest } from 'next/server';
import { must_not } from '@/_utilities/api-calls/call-legacy-search';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { POST as getPipelineSample } from '@/app/api/pipeline/route';
import FooterIterator from '@/components/RxFooter';
import RxNotifications from '@/components/RxNotifications';
import { LOGO_FIELDS } from '@/_constants/agent-fields';
import { getAgentMapDefaultUrl } from '@/_utilities/data-helpers/agent-helper';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import Iterator from './page-iterator.module';
import NavIterator from '@/components/Nav/RxNavIterator';
import { PropertyDataModel } from '@/_typings/property';

export default async function PageComponent({ agent_id, theme = 'default' }: { agent_id: string; theme?: string }) {
  console.log('Loading app/[slug]/[profile-slug]/page.module.tsx', { slug: agent_id });
  const agent = await findAgentRecordByAgentId(agent_id);
  let webflow_site = `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${agent.webflow_domain || WEBFLOW_DASHBOARDS.CUSTOMER}/index.html`;
  if (!agent) return <></>;
  if (!agent.webflow_domain && theme) {
    if (theme === 'default') webflow_site = `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${WEBFLOW_DASHBOARDS.CUSTOMER}/index.html`;
    else webflow_site = `https://${process.env.NEXT_PUBLIC_RX_SITE_BUCKET}/${theme}-leagent.webflow.io/index.html`;
  } else if (agent.domain_name) webflow_site = `https://${agent.domain_name}`;

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
    }
  }

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

  $('a[href="/map"]').each((i, el) => {
    const attribs = Object.keys(el.attribs).map(attr => {
      let val = el.attribs[attr];
      if (attr === 'href') {
        return `${attr}=${getAgentMapDefaultUrl(agent)}`;
      }
      return `${attr}="${val}"`;
    });
    $(el).replaceWith(`<a ${attribs.join(' ')}>${$(el).html()}</a>`);
  });

  const internal_req = {
    json() {
      return {
        from: 0,
        size: 3,
        sort: {
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
            minimum_should_match: 0,
            must_not,
          },
        },
      } as LegacySearchPayload;
    },
  } as unknown as NextRequest;
  const intsold_req = {
    json() {
      return {
        from: 0,
        size: 2,
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
            minimum_should_match: 0,
            must_not,
          },
        },
      } as LegacySearchPayload;
    },
  } as unknown as NextRequest;

  const [active, sold] = await Promise.all([getPipelineSample(internal_req, { internal: true }), getPipelineSample(intsold_req, { internal: true })]);
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
  $('[data-group="footer"]').remove();

  const body = $('body > div');

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
