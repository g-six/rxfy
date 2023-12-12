import { CheerioAPI, load } from 'cheerio';
import { headers } from 'next/headers';
import { getAgentBy } from './api/_helpers/agent-helper';
import DataContextAtom from '@/_data/data-context.atom';
import { DOMNode, domToReact } from 'html-react-parser';
import { ReactElement } from 'react';
import fetchData from '@/_data/fetchData';
import { getDomain } from './api/domains/model';
import { consoler } from '@/_helpers/consoler';

async function getPageMetadata(): Promise<{
  title: string;
  description: string;
  html: string;
  subcontexts: { [k: string]: { filters: string[] } };
  base_context: string;
  domain_name: string;
  data?: { [k: string]: any };
}> {
  let domain_name = headers().get('host') || '';
  let title = '';
  let description = 'Leagent';
  let data: { [k: string]: any } = {};
  let subcontexts: { [k: string]: { filters: string[] } } = {};
  let base_context = '';
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

  const url = headers().get('x-pathname');
  let page_url = `https://leagent-test.webflow.io${url}`;

  if (domain_name) {
    const domain = await getDomain(domain_name);
    base_context = domain.context;
    if (domain.context === 'agent') {
      const agent = await getAgentBy({
        domain_name,
      });
      if (agent?.webflow_domain) {
        page_url = `https://${agent?.webflow_domain}${url}`;
        data = {
          ...data,
          agent,
        };
      }
    }
  }
  let html = '';

  const page_html_xhr = await fetch(page_url);
  if (page_html_xhr.ok) {
    html = await page_html_xhr.text();
    const $: CheerioAPI = load(html);

    $('[data-context]').each((rdx, el) => {
      if (!data[el.attribs['data-context']]) {
        if (el.attribs['data-filter']) {
          if (!subcontexts[el.attribs['data-context']]) {
            subcontexts = {
              ...subcontexts,
              [el.attribs['data-context']]: {
                filters: [el.attribs['data-filter']],
              },
            };
          } else {
            const { filters } = subcontexts[el.attribs['data-context']] as {
              filters?: string[];
            };
            if (!filters) {
              subcontexts[el.attribs['data-context']].filters = [el.attribs['data-filter']];
            } else {
              subcontexts[el.attribs['data-context']].filters.push(el.attribs['data-filter']);
            }
          }
        } else console.log(el.attribs['data-context'], 'has nothing to reference it with');
      }
    });
    title = data.agent?.full_name || $('title').text();
    if (data.agent?.metatags?.title) title = data.agent?.metatags?.title;
    if (data.agent?.metatags?.description) description = data.agent?.metatags.description;
  }

  if (Object.keys(subcontexts).length) {
    // Has other nested contexts to agent
    const promises = await Promise.all(
      Object.keys(subcontexts).map(async context => {
        if (subcontexts[context]) {
          const filters = subcontexts[context];
        }
      }),
    );
  }

  return {
    title,
    description,
    domain_name,
    data,
    html,
    base_context,
    subcontexts,
  };
}

export default async function Page() {
  const ts = Date.now();
  const { html, base_context, subcontexts, ...others } = await getPageMetadata();

  const $: CheerioAPI = load(html);
  let data = others.data || {};

  if (data[base_context]) {
    const promises = await Promise.all(
      Object.keys(subcontexts).map(async context => {
        return await Promise.all(
          subcontexts[context].filters.map(async filter => {
            if (!data[context]) {
              data = {
                ...data,
                [context]: {
                  [filter]: await fetchData(context, filter, data[base_context]),
                },
              };
            } else if (!data[context][filter]) {
              data = {
                ...data,
                [context]: {
                  ...data[context],
                  [filter]: await fetchData(context, filter, data[base_context]),
                },
              };
            }
          }),
        );
      }),
    );
  }

  return (
    <DataContextAtom data={data} fallback-context={base_context} contexts={subcontexts}>
      {domToReact($('body') as unknown as DOMNode[]) as ReactElement}
    </DataContextAtom>
  );
}
