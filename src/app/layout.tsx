import { CheerioAPI, load } from 'cheerio';
import { cookies, headers } from 'next/headers';
import { getAgentBy } from './api/_helpers/agent-helper';
import { Metadata } from 'next';
import Head from 'next/head';
import { DOMNode, attributesToProps, domToReact } from 'html-react-parser';
import Script from 'next/script';

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
    const url = headers().get('x-pathname');
    const page_url = `https://${data.webflow_domain}${url}`;
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
export async function generateMetadata({ params }: { params: { [k: string]: any } }): Promise<Metadata> {
  let { title, description } = await getPageMetadata();

  return {
    title,
    description,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { html, data } = await getPageMetadata();
  const $: CheerioAPI = load(html);

  // if (cookies().get('session_key')) {
  //   $('[data-group="out_session"]').remove();
  // } else {
  //   $('[data-group="in_session"]').remove();
  // }
  // $('form').each((idx, form) => {
  //   $(form).replaceWith(`<div data-form="contact">${$(form).html()}</div>`);
  // });

  return <html dangerouslySetInnerHTML={{ __html: $('html').html() || '' }} suppressHydrationWarning />;
}
