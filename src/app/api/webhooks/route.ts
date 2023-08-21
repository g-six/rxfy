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
  'ai',
  'ai-waitlist',
  'ai-result',
];

async function cacheSite(domain: string) {
  const scripts: string[] = [];
  const invalidation_uris: string[] = [];

  await Promise.all(
    pages.map(async (page: string) => {
      const url = 'https://' + domain + (page === 'index' ? '' : '/' + page);
      const html = await axios.get(url);
      const $: CheerioAPI = load(html.data);

      $('script').each((i, el) => {
        if (el.attribs.src && !scripts.includes(el.attribs.src)) {
          const { pathname } = new URL(el.attribs.src);
          scripts.push(el.attribs.src);
          $(el).attr('src', pathname);
        }
      });

      const page_uri = domain + '/' + page + '.html';
      invalidation_uris.push(page_uri);
      createCacheItem($.html(), page_uri, 'text/html', false);
    }),
  );
  const results = await Promise.all(
    scripts.map(async v => {
      const js = await axios.get(v);
      const { pathname } = new URL(v);
      invalidation_uris.push(domain + pathname);
      createCacheItem(js.data, domain + pathname, 'text/javascript', false);
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
  invalidateCache(invalidations);
  return NextResponse.json({ payload, invalidations });
}
