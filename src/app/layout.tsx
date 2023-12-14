import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';
import { getAgentBy } from './api/_helpers/agent-helper';
import { consoler } from '@/_helpers/consoler';
import { DOMNode, domToReact } from 'html-react-parser';

async function getPageMetadata(): Promise<{ title: string; description: string; html: string; domain_name: string; data?: { [k: string]: any } }> {
  let domain_name = headers().get('host') || '';
  let title = '';
  let description = 'Leagent';
  let data: { [k: string]: any } = {};
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
  }
  if (domain_name) {
    data = await getAgentBy({
      domain_name,
    });

    let webflow_domain = data?.webflow_domain || 'leagent-website.webflow.io';

    const url = headers().get('x-pathname');
    const page_url = `https://${data?.webflow_domain}${url}`;
    const page_html_xhr = await fetch(page_url);
    if (page_html_xhr.ok) {
      if (data?.webflow_domain) {
        const html = await page_html_xhr.text();
        const $: CheerioAPI = load(html);
        title = data.full_name;
        if (data.metatags?.title) title = data.metatags.title;
        if (data.metatags?.description) description = data.metatags.description;
      }
    }
  }

  let html = '';

  if (domain_name) {
    const url = headers().get('x-pathname');
    const page_url = `https://${data.webflow_domain}${url}`;
    const page_html_xhr = await fetch(page_url);
    if (page_html_xhr.ok) {
      if (data?.webflow_domain) {
        html = await page_html_xhr.text();
      }
    }
  }

  return {
    title,
    description,
    domain_name,
    data,
    html,
  };
}
// export async function generateMetadata({ params }: { params: { [k: string]: any } }): Promise<Metadata> {
//   let { title, description } = await getPageMetadata();

//   return {
//     title,
//     description,
//   };
// }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ts = Date.now();
  const { html } = await getPageMetadata();
  const $: CheerioAPI = load(html);

  consoler('layout.tsx', `${Date.now() - ts}ms`);

  const head = $('head');

  return (
    <html suppressHydrationWarning>
      <head dangerouslySetInnerHTML={{ __html: head.html() || '' }} suppressHydrationWarning />
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
