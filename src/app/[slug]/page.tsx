import { REALTOR_DASHBOARD_SLUGS } from '@/_constants/page-slugs';
import { AgentData } from '@/_typings/agent';
import DefaultPage from '@/app/page';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { cookies, headers } from 'next/headers';
import { Children, ReactElement } from 'react';
import { getUserSessionData } from '../api/check-session/model';
import RxCRM from '@/rexify/realtors/RxCRM';
import RxCustomerView from '@/rexify/realtors/RxCustomerView';
import RxRealtorNav from '@/components/Nav/RxRealtorNav';
import { getCustomerLoves } from '@/app/api/agents/customer/[id]/loves/model';
import { getAgentMapDefaultUrl } from '@/_utilities/data-helpers/agent-helper';

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
    // $('[data-field="empty_state"]').addClass('opacity-0 initially-hidden');
    // $('[data-component]').addClass('opacity-0 initially-hidden');
    // $('.w-tab-content [data-w-tab] > *').addClass('hidden initially-hidden');
    if (props.searchParams?.customer && session.agent?.customers) {
      const properties = await getCustomerLoves(Number(props.searchParams.customer));
      if (properties.length) {
        $('#SavedHomes [data-field="empty_state"]').remove();
      } else {
        $('#SavedHomes [data-action="find_homes"]').each((i, el) => {
          el.attribs.href = getAgentMapDefaultUrl(session.agent as AgentData) + '&customer=' + props.searchParams.customer;
        });
      }
    }
    let body = $('body .dash-wrapper');

    const wrapped = domToReact(body as unknown as DOMNode[]) as unknown as ReactElement;
    return (
      <main className='main-container dash-wrapper'>
        <RxRealtorNav>{domToReact(nav as unknown as DOMNode[]) as React.ReactElement}</RxRealtorNav>

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
