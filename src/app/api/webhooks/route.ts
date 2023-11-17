import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { NextResponse } from 'next/server';
import { createCacheItem, invalidateCache } from '../_helpers/cache-helper';
import convert from 'xml-js';

const BUCKET_NAME = process.env.NEXT_PUBLIC_RX_SITE_BUCKET as string;
const CLOUDFRONT_DISTRIBUTION_ID = 'EU4BBJ173XBCG';
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
  'homepage',
  'log-in',
  'login',
  'sign-up',
  'signup',
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
  'brochure',
  'ai',
  'ai-waitlist',
  'ai-result',
  'my-all-properties',
  'client-dashboard',
  'my-documents',
  'my-home-alerts',
  'compare',
  'private-listings',
  'selling',
].concat(['pricing', 'examples', 'contact']);
function getLast(object: any) {
  if (typeof object !== 'object') {
    return object.trim();
  }
  for (const prop in object) {
    return getLast(object[prop]);
  }
}
async function cacheSite(domain: string) {
  const invalidation_uris: string[] = [];
  const sitemap_file = await fetch('https://' + domain + '/sitemap.xml');
  const xml = await sitemap_file.text();

  const sitemap = convert.xml2js(xml, { compact: true });
  const {
    urlset: { url },
  } = sitemap as unknown as {
    urlset: {
      url: unknown[];
    };
  };

  url.map(getLast).map(p => {
    const { pathname } = new URL(p);
    if (pathname.length > 1 && !pages.includes(pathname.substring(1))) {
      pages.push(pathname.substring(1));
    }
  });

  createCacheItem(JSON.stringify({ pages }, null, 4), domain + `/pages.json`, 'text/javascript', false, BUCKET_NAME);

  await Promise.all(
    pages.map(async (page: string) => {
      const url = 'https://' + domain + (page === 'index' ? '' : '/' + page);
      try {
        const scripts: string[] = [];
        const html = await axios.get(url);
        const $: CheerioAPI = load(html.data);
        $('script').each((i, el) => {
          if (el.attribs.src && !scripts.includes(el.attribs.src)) {
            const { pathname } = new URL(el.attribs.src);
            scripts.push(el.attribs.src);
            let filename = pathname.split('/').pop();
            if (filename?.indexOf('webflow.') === 0) {
              filename = `//${BUCKET_NAME}/${domain}/webflow.js`;
              console.log('Found webflow for', url);
              $(el).attr('src', filename);
            } else filename = pathname;
          }
        });

        const page_uri = domain + '/' + page + '.html';
        console.log('Invalidating', page_uri);
        invalidation_uris.push(page_uri);

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
            if (page !== 'index') filename = `/${page}${filename}`;
            createCacheItem(
              js.data.split('addDocumentClass();').join('console.log("Skipping webflow script that causes html tag class error");'),
              domain + filename,
              'text/javascript',
              false,
              BUCKET_NAME,
            );
          }),
        );
        $('.w-nav').removeClass('w-nav');
        console.log('DONE');
        console.log('');
        createCacheItem($.html(), page_uri, 'text/html', false, BUCKET_NAME);
      } catch (e) {
        // console.log('Could not reach', url);
      } finally {
        // console.log(url, 'cached when found');
      }
    }),
  );
  return invalidation_uris;
}

export async function POST(req: Request) {
  const payload: WebflowWebhookPayload = await req.json();
  console.log('api.webhooks.POST payload');
  console.log(JSON.stringify(payload, null, 4));
  const response = await Promise.all(payload.domains.map(async domain => cacheSite(`${domain}`)));
  const invalidations: string[] = [];
  response.forEach(r => {
    r.forEach(path => invalidations.push(`/${path}`));
  });
  await invalidateCache(['/*'], CLOUDFRONT_DISTRIBUTION_ID);
  return NextResponse.json({ payload, invalidations });
}
