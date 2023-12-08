import { consoler } from '@/_helpers/consoler';
import { AgentData, ThemeName } from '@/_typings/agent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { Children, ReactElement, cloneElement } from 'react';

const FILE = '[slug]/[etc]/page.tsx';
export async function generateMetadata({ params }: { params: { slug: string; etc: string } }): Promise<Metadata> {
  let { etc: html_file_name, slug: agent_id } = params;
  const agent = await findAgentRecordByAgentId(headers().get('x-agent-id') || agent_id);

  if (html_file_name.length > 3) {
    if (agent?.id) {
      const { metatags } = agent as unknown as AgentData;
      return {
        title: metatags.title,
        description: metatags.description,
        keywords: metatags.keywords ? metatags.keywords.join(', ') : 'Leagent, Realtor',
      };
    }
  }
  return {
    title: agent_id,
  };
}

function Iterator({ children }: { children: ReactElement }) {
  const Rexified = Children.map(children, c => {
    const agent_id = headers().get('x-agent-id') as string;
    const hostname = headers().get('x-hostname') as string;
    if (c.props && agent_id) {
      if (c.props['data-field']) {
        const field = c.props['data-field'];
        const value = headers().get(`x-agent-${field}`);
        switch (field) {
          case 'phone':
            return cloneElement(c, { href: `tel:${value}` }, <span>{value}</span>);
          case 'email':
            return cloneElement(c, { href: `mailto:${value}` }, <span>{value}</span>);
          default:
            if (value) {
              return cloneElement(c, {}, <span>{value}</span>);
            }
        }
      }
      if (c.type === 'img' && c.props['data-field']) {
        const field = c.props['data-field'];
        let src = '';
        switch (field) {
          case 'logo_for_light_bg':
            src = headers().get('X-Light-Bg-Logo') || '';
            break;
          case 'logo_for_dark_bg':
            src = headers().get('X-Light-Bg-Logo') || '';
            break;
        }
        if (src) {
          return (
            <span
              className='h-10 w-32 inline-block bg-cover bg-center rounded-lg bg-no-repeat'
              style={{ backgroundImage: `url(${getImageSized(src, 200)})` }}
            />
          );
        }
      }
      if (c.type === 'a') {
        let { href, className } = c.props;
        if (c.props['data-usertype'] === 'client') {
          if (className) {
            if (className.split(' ').includes('in-session')) {
              if (!cookies().get('session_key') || `${cookies().get('session_as')}` === 'realtor') {
                return <></>;
              }
            }
            if (className.split(' ').includes('out-session')) {
              if (cookies().get('session_key') || `${cookies().get('session_as')}` === 'customer') {
                return <></>;
              }
            }
          }
        }
        if (!href?.toLowerCase().includes(`/${agent_id}`.toLowerCase()) && hostname?.includes('leagent.com')) {
          return cloneElement(c, { href: `/${agent_id}${href}` });
        }
      }
      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(c, {}, <Iterator>{c.props.children}</Iterator>);
      }
    }
    return c;
  });
  return <>{Rexified}</>;
}

export default async function AgentHomePage({ params, searchParams }: { params: { slug: string; etc: string }; searchParams: { [k: string]: string } }) {
  let { etc: html_file_name, slug: agent_id } = params;

  if (html_file_name.length > 3 && headers().get('x-url')?.includes(html_file_name)) {
    const page = await fetch(headers().get('x-url') as string);
    if (page.ok) {
      const html = await page.text();
      const $: CheerioAPI = load(html);
      const body = $('body > div,section');
      return <Iterator>{domToReact(body as unknown as DOMNode[]) as ReactElement}</Iterator>;
    }
  }
  return <>{html_file_name}</>;
}
