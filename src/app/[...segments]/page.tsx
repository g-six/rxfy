import dynamic from 'next/dynamic';
import { headers } from 'next/headers';
import { getAgentBy } from '../api/_helpers/agent-helper';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import Head from 'next/head';

async function Page({ params, searchParams }: { params: { segments: string[] }; searchParams?: { [k: string]: string } }) {
  let domain_name = headers().get('host');
  if (domain_name) {
    const domain = domain_name.split(':').reverse().pop() as string;
    if (domain) {
      domain_name = domain;

      // For dev local machine, strip out .local at the end
      if (domain_name.indexOf('.local') === domain_name.length - 6) {
        domain_name = domain_name.substring(0, domain_name.indexOf('.local'));
      } else if (domain_name.indexOf('.grey') === domain_name.length - 5) {
        domain_name = domain_name.substring(0, domain_name.indexOf('.grey'));
      }
    }
    if (domain_name) {
      const agent = await getAgentBy({
        domain_name,
      });
      if (agent?.webflow_domain) {
        const page_url = `https://${agent.webflow_domain}${params.segments.length ? '/' : ''}${params.segments.join('/')}`;
        const page_html_xhr = await fetch(page_url);
        if (page_html_xhr.ok) {
          const html = await page_html_xhr.text();
          const $: CheerioAPI = load(html);
          $('[data-field]').each((idx, el) => {
            if (el.tagName !== 'img') {
              const field = $(el).attr('data-field');
              if (field) $(el).text(field);
            }
          });
          const links = $('head > link');
          const scripts = $('head > script');
          const body = $('body > *:not(script)');
          const page = $('html');

          return <>{body && domToReact(body as unknown as DOMNode[])}</>;
        }
        return <>{page_url}</>;
      }
      return <pre>{JSON.stringify(agent, null, 4)}</pre>;
    }
  }

  return <>{JSON.stringify(params.segments, null, 4)}</>;
}

export default dynamic(() => Promise.resolve(Page), {
  ssr: false,
});
