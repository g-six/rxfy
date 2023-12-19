import { CheerioAPI, load } from 'cheerio';
import { cookies, headers } from 'next/headers';
import { getAgentBy } from './api/_helpers/agent-helper';
import DataContext from '@/_data/data-context';
import { DOMNode, domToReact } from 'html-react-parser';
import { ReactElement } from 'react';
import fetchData from '@/_data/fetchData';
import { getDomain } from './api/domains/model';
import { consoler } from '@/_helpers/consoler';
import { AgentData } from '@/_typings/agent';

type SubcontextProps = { [k: string]: { filters: string[]; sort: string[] } };
const FILE = 'app/page.tsx';
export async function getPageMetadata(): Promise<{
  status: number;
  title: string;
  description: string;
  html: string;
  subcontexts: SubcontextProps;
  base_context: string;
  domain_name: string;
  data?: { [k: string]: any };
}> {
  let domain_name = headers().get('host') || '';
  let page_status = 200;
  let title = '';
  let agent: AgentData | undefined = undefined;
  let description = 'Leagent';
  let data: { [k: string]: any } = await buildSessionData();
  let subcontexts: SubcontextProps = {};
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
    // For Leagent, it's agent
    if (domain.context === 'agent') {
      agent = await getAgentBy({
        domain_name,
      });
      if (agent?.webflow_domain) {
        page_url = `https://${agent?.webflow_domain}${url || ''}`;
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
                sort: [el.attribs['data-sort'] || ''],
              },
            };
          } else {
            const { filters, sort } = subcontexts[el.attribs['data-context']] as {
              filters?: string[];
              sort?: string[];
            };
            if (!filters) {
              subcontexts[el.attribs['data-context']].filters = [el.attribs['data-filter']];
              subcontexts[el.attribs['data-context']].sort = [el.attribs['data-sort'] || ''];
            } else if (!subcontexts[el.attribs['data-context']].filters.includes(el.attribs['data-filter'])) {
              subcontexts[el.attribs['data-context']].filters.push(el.attribs['data-filter']);
              subcontexts[el.attribs['data-context']].sort.push(el.attribs['data-sort']);
            }
          }
        } else console.log(el.attribs['data-context'], 'has nothing to reference it with');
      }
    });
    title = data.agent?.full_name || $('title').text();
    if (data.agent?.metatags?.title) title = data.agent?.metatags?.title;
    if (data.agent?.metatags?.description) description = data.agent?.metatags.description;
  } else {
    html = await page_html_xhr.text();
    // Page does not exist on Webflow
  }

  return {
    title,
    description,
    domain_name,
    data,
    html,
    status: page_status,
    base_context,
    subcontexts,
  };
}

export default async function Page() {
  const ts = Date.now();
  const { html, base_context, subcontexts, status, ...others } = await getPageMetadata();

  const $: CheerioAPI = load(html);
  $('[aria-controls]').each((idx, el) => {
    $(el).removeAttr('aria-controls');
  });
  $('[aria-current]').each((idx, el) => {
    $(el).removeAttr('aria-current');
  });

  let data = others.data || {};
  let filtered_contexts: { [k: string]: { [k: string]: unknown } } = {};

  if (data[base_context]) {
    await Promise.all(
      Object.keys(subcontexts).map(async context => {
        data[context] = data[context] || {};
        return await Promise.all(
          subcontexts[context].filters.map(async (filter, idx) => {
            const r = await fetchData(context, filter, data[base_context], subcontexts[context].sort[idx]);
            if (filtered_contexts[context]) {
              filtered_contexts[context] = {
                ...filtered_contexts[context],
                [filter]: r,
              };
            } else {
              filtered_contexts[context] = {
                [filter]: r,
              };
            }
          }),
        );
      }),
    );
  }

  const divs = $('body > :not(script)');

  /**
   * Very important!  Webflow's javascript messes with the scripts we create to handle data-context + data-field + data-etc
   * so we only load the script after all our scripts are done loaded (code to add in layout.tsx)
   */
  $('body > script[src*=webflow]').remove();

  return (
    <DataContext
      data={{
        ...data,
        ...filtered_contexts,
      }}
      fallback-context={base_context}
      contexts={subcontexts}
    >
      <>{domToReact(divs as unknown as DOMNode[]) as ReactElement}</>
    </DataContext>
  );
}

async function buildSessionData() {
  // TODO
  return {
    client: {},
  };
  /*

  // Check if a client (for an agent) is logged in
  let session_key = cookies().get('session_all')?.value || '';
  let session_as = cookies().get('session_as')?.value || '';
  if (session_key) {
    if (session_as === 'realtor') {
      // Check if a an agent is logged in
    } else if (data?.agent) {
      // If user is not logged in and data-context = client,
      // fallback to agent as reference so that Rx can link user
      // to the agent of the website when signing in / up
      const clients = data.agent.customers.data?.map((client: { attributes: { customer: { data: { attributes: { [k: string]: string }; id: number } } } }) => {
        const { attributes, id: customer_id } = client.attributes.customer.data;
        return {
          ...attributes,
          id: Number(customer_id),
        };
      });
      data = {
        ...data,
        client: {
          filters: [], // blank as we don't have the info of the client when not in session
          sort: [], // blank as we don't have the info of the client when not in session
        },
      };
    }
  }
  */
}
