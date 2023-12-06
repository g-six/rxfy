import React from 'react';
import { DOMNode, domToReact } from 'html-react-parser';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import Container from './container.module';
import { AgentData } from '@/_typings/agent';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { retrieveSavedSearches } from '@/app/api/saved-searches/model';
import { SavedSearchOutput } from '@/_typings/saved-search';
import NavIterator from '@/components/Nav/RxNavIterator';
import { getUserSessionData } from '@/app/api/check-session/model';
import { replaceAgentFields } from '@/app/property/page.helpers';

export default async function MyHomeAlerts({ params }: { params: { [key: string]: string } }) {
  if (!cookies().get('session_key')?.value) redirect(`log-in`);

  let url = headers().get('x-url') || '';
  let base_path = '/';
  if (!url) url = 'https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/my-home-alerts?x=2';

  const promises = await Promise.all([
    axios.get(url),
    findAgentRecordByAgentId(params.slug),
    getUserSessionData(`Bearer ${cookies().get('session_key')?.value}`, 'customer'),
  ]);
  const { data: html } = promises[0];
  const agent: AgentData = promises[1];
  const user = promises[2] as unknown as { [key: string]: string };

  if (!agent?.agent_id) redirect(`/log-in`);

  if (url.includes(WEBFLOW_DASHBOARDS.CUSTOMER)) {
    base_path = `/${agent.agent_id}/${agent.metatags.profile_slug}`;
  }

  if (!user || user.session_key !== cookies().get('session_key')?.value) redirect(`${base_path}/log-in`);

  if (html && agent) {
    const $: CheerioAPI = load(html);
    const nav = $('body .navbar---dashboard');
    $('body .navbar---dashboard').remove();
    replaceAgentFields($);
    const contents = $('body > div:not(.navbar---dashboard)');
    const records: SavedSearchOutput[] = await retrieveSavedSearches(Number(user.id));

    return (
      <>
        {base_path === '/' ? (
          domToReact(nav as unknown as DOMNode[])
        ) : (
          <NavIterator agent={agent}>{domToReact(nav as unknown as DOMNode[]) as React.ReactElement}</NavIterator>
        )}
        <section className={$('body > div').attr('class')}>
          <Container agent={agent} records={records}>
            {domToReact(contents as unknown as DOMNode[]) as React.ReactElement}
          </Container>
        </section>
      </>
    );
  }

  return <></>;
}
