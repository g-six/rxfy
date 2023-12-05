import { RxNavIterator } from '@/rexify/realtors/RxNavIterator';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, attributesToProps, domToReact } from 'html-react-parser';
import { cookies, headers } from 'next/headers';
import React, { Children, ReactElement, cloneElement } from 'react';
import MyListingsTabContents from './tab-contents.rexifier';
import MyListingsTabMenu from './tab-menu.rexifier';
import { redirect } from 'next/navigation';
import NotFound from '../not-found';
import { getUserSessionData } from '../api/check-session/model';
import { AgentData } from '@/_typings/agent';
import RxNotifications from '@/components/RxNotifications';
import RxDialog from '@/components/RxDialogs/RxDialog';

interface Props {
  params: { [k: string]: string };
  searchParams: { [k: string]: string };
}

function Rexified({ agent, children, ...page }: { children: ReactElement; agent: AgentData } & Props) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        let { className = '', children: components, ...props } = c.props;
        className = `${className}${className && ' '}rexified`;

        if (className.includes('dash-tabs')) {
          return (
            <MyListingsTabMenu
              {...props}
              active-tab={page.searchParams?.id || page.searchParams?.action === 'new' ? 'new private listing' : 'tab 1'}
              className={className}
            >
              {components}
            </MyListingsTabMenu>
          );
        }
        if (className.includes('tabs-content')) {
          return (
            <MyListingsTabContents {...page} {...props} agent={agent} className={className}>
              {components}
            </MyListingsTabContents>
          );
        }

        return cloneElement(
          c,
          {
            className,
          },
          <Rexified {...page} agent={agent}>
            {c.props.children}
          </Rexified>,
        );
      }
    }
    return c;
  });

  return <>{rexified}</>;
}

export default async function MyListings(page: Props) {
  const source_html_url = headers().get('x-url') || '';
  const page_xhr = await fetch(source_html_url);
  const html = await page_xhr.text();
  const $: CheerioAPI = load(html);

  const nav = $('.navigation-full-wrapper');

  const session_key = cookies().get('session_key')?.value;
  const session_as = cookies().get('session_as')?.value;
  if (!session_key) {
    redirect('/log-in');
  }
  if (session_as !== 'realtor') return <NotFound />;

  const agent = await getUserSessionData(session_key, session_as);

  $('.navigation-full-wrapper').remove();

  $('body div:first-child .fake-dropdown:first-child').remove();

  const TabbedDashboard = $('body div:first-child .tabs-vertical > *');
  let TabbedDashboardProps: {} = {};
  $('body div:first-child .tabs-vertical').each((i, rl) => {
    TabbedDashboardProps = attributesToProps(rl.attribs);
  });

  $('body .tabs-vertical').remove();

  const body = $('body div:first-child');

  return (
    <div className={body.attr('class')}>
      <RxNavIterator>{domToReact(nav as unknown as DOMNode[]) as ReactElement}</RxNavIterator>
      <div className='dash-area my-listings-dashboard'>
        <main {...TabbedDashboardProps}>
          <Rexified {...page} agent={agent as AgentData} preview-html={''}>
            {domToReact(TabbedDashboard as unknown as DOMNode[]) as ReactElement}
          </Rexified>
        </main>
      </div>
      <RxNotifications />
      <RxDialog />
    </div>
  );
}
