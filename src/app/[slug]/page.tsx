import { REALTOR_DASHBOARD_SLUGS } from '@/_constants/page-slugs';
import { AgentData } from '@/_typings/agent';
import DefaultPage from '@/app/page';
import NavIterator from '@/components/Nav/RxNavIterator';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { cookies, headers } from 'next/headers';
import { Children, ReactElement, ReactNode } from 'react';
import { getUserSessionData } from '../api/check-session/model';
import RxCRM from '@/rexify/realtors/RxCRM';
import RxCustomerView from '@/rexify/realtors/RxCustomerView';

function Rexify(p: { children: ReactElement }) {
  const rexified = Children.map(p.children, c => {
    return c;
  });

  return <>{rexified}</>;
}

export default async function Page(props: { params: { [k: string]: string }; searchParams: { [k: string]: string } }) {
  const page_url = headers().get('x-url') || '';
  const session_key = cookies().get('session_key')?.value;
  const session: { agent?: AgentData } = {};

  if (session_key) {
    const agent = await getUserSessionData(session_key, 'realtor');
    if (agent.id) {
      session.agent = agent as AgentData;
    }
  }

  if (page_url && REALTOR_DASHBOARD_SLUGS.includes(props.params.slug)) {
    const fetch_req = await fetch(page_url);
    const html = await fetch_req.text();
    const $: CheerioAPI = load(html);
    // Extract nav first
    const nav = $('body [class^="navigation-full-wrapper"]');
    $('body [class^="navigation-full-wrapper"]').remove();

    // Add hidden class to data-field="empty_state" components
    $('[data-field="empty_state"]').addClass('opacity-0 initially-hidden');
    $('[data-component]').addClass('opacity-0 initially-hidden');
    $('.w-tab-content [data-w-tab] > *').addClass('hidden initially-hidden');
    const body = $('body .dash-wrapper');

    const wrapped = domToReact(body as unknown as DOMNode[]) as unknown as ReactElement;
    return (
      <main className='main-container dash-wrapper'>
        <NavIterator agent={session.agent}>{domToReact(nav as unknown as DOMNode[]) as React.ReactElement}</NavIterator>

        {/* Main CRM Dashboard */}
        {props.params.slug === 'dash-mycrm' && <RxCRM agent={session.agent}>{wrapped}</RxCRM>}

        {/* Customer View */}
        {props.params.slug === 'dash-mycrm-saved' && <RxCustomerView agent={session.agent}>{wrapped}</RxCustomerView>}
      </main>
    );
  } else {
    return <DefaultPage {...props} />;
  }
}
