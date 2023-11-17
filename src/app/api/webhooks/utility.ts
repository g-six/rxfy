import { CheerioAPI, load } from 'cheerio';
import { createCacheItem } from '../_helpers/cache-helper';
const BUCKET_NAME = process.env.NEXT_PUBLIC_RX_SITE_BUCKET as string;

export async function savePageToBucket(filepath: string) {
  const invalidation_uris: string[] = [];
  const scripts: string[] = [];
  console.log('Crawl', `https://${filepath}`);
  const r = await fetch(`https://${filepath}`);
  const html = await r.text();
  const $: CheerioAPI = load(html);
  $('script').each((i, el) => {
    if (el.attribs.src && !scripts.includes(el.attribs.src)) {
      const { pathname } = new URL(el.attribs.src);
      scripts.push(el.attribs.src);
      let filename = pathname.split('/').pop();
      if (filename?.indexOf('webflow.') === 0) {
        filename = `//${BUCKET_NAME}/${filepath.split('/').reverse().pop()}/webflow.js`;
        console.log(`Found webflow for https://${filepath}`);
        $(el).attr('src', filename);
      } else filename = pathname;
    }
  });

  const page_uri = `${filepath}.html`;
  console.log('Invalidating', page_uri);
  invalidation_uris.push(page_uri);

  await Promise.all(
    scripts.map(async v => {
      const r = await fetch(v);
      const js = await r.text();
      const { pathname } = new URL(v);
      let filename = pathname.split('/').pop();
      if (filename?.indexOf('webflow.') === 0) {
        filename = '/webflow.js';
      } else {
        filename = pathname;
      }

      createCacheItem(
        js.split('addDocumentClass();').join('console.log("Skipping webflow script that causes html tag class error");'),
        filepath,
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
}
