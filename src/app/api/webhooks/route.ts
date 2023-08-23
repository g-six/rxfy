import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { NextResponse } from 'next/server';
import { createCacheItem, invalidateCache } from '../_helpers/cache-helper';

interface WebflowWebhookPayload {
  site: string;
  publishTime: number;
  domains: string[];
  publishedBy: {
    name: string;
    id: string;
  };
}

const pages = [
  'index',
  'log-in',
  'reset-password',
  'update-password',
  'map',
  'property/propertyid',
  'my-profile',
  'my-website',
  'my-listings',
  'dash-my-tools',
  'dash-mycrm',
  'dash-mycrm-saved',
  'dash-mycrm-home-alerts',
  'dash-mycrm-profile',
  'dash-mycrm-documents',
  'pdf',
  'ai',
  'ai-waitlist',
  'ai-result',
  'my-all-properties',
  'client-dashboard',
  'my-documents',
  'my-home-alerts',
  'my-home-alerts',
  'compare',
  'private-listings',
].concat(['pricing', 'examples', 'contact']);

async function cacheSite(domain: string) {
  const scripts: string[] = [];
  const invalidation_uris: string[] = [];

  await Promise.all(
    pages.map(async (page: string) => {
      const url = 'https://' + domain + (page === 'index' ? '' : '/' + page);
      try {
        const html = await axios.get(url);
        const $: CheerioAPI = load(html.data);

        let html_body = $.html();

        $('script').each((i, el) => {
          if (el.attribs.src && !scripts.includes(el.attribs.src)) {
            const { pathname } = new URL(el.attribs.src);
            scripts.push(el.attribs.src);
            let filename = pathname.split('/').pop();
            if (filename?.indexOf('webflow.') === 0) {
              filename = 'webflow.js';
              $(el).attr('src', '/' + filename);
            }
          }
        });

        const page_uri = domain + '/' + page + '.html';
        invalidation_uris.push(page_uri);
        createCacheItem($.html(), page_uri, 'text/html', false);
      } catch (e) {
        console.log('Could not reach', url);
      } finally {
        console.log(url, 'cached when found');
      }
    }),
  );
  await Promise.all(
    scripts.map(async v => {
      const js = await axios.get(v);
      const { pathname } = new URL(v);
      let filename = pathname.split('/').pop();
      if (filename?.indexOf('webflow.') === 0) {
        filename = '/webflow.js';
      } else {
        filename = pathname;
      }
      createCacheItem(js.data, domain + filename, 'text/javascript', false);
    }),
  );
  return invalidation_uris;
}

export async function POST(req: Request) {
  const payload: WebflowWebhookPayload = await req.json();
  const response = await Promise.all(payload.domains.map(async domain => cacheSite(`${domain}`)));
  const invalidations: string[] = [];
  response.forEach(r => {
    r.forEach(path => invalidations.push(`/${path}`));
  });
  invalidateCache(['/*']);
  return NextResponse.json({ payload, invalidations });
}
