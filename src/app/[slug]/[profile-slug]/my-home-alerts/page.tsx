import React from 'react';
import { DOMNode, domToReact } from 'html-react-parser';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import Container from './container.module';
import { AgentData } from '@/_typings/agent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { getUserSessionData } from '@/app/api/check-session/route';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { retrieveSavedSearches } from '@/app/api/saved-searches/model';
import { SavedSearchOutput } from '@/_typings/saved-search';
import { replaceAgentFields } from '@/app/property/page';
import NavIterator from '@/components/Nav/RxNavIterator';

export default async function MyHomeAlerts({ params }: { params: { [key: string]: string } }) {
  if (!cookies().get('session_key')?.value) redirect(`log-in`);

  const promises = await Promise.all([
    axios.get('https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/my-home-alerts?x=2'),
    findAgentRecordByAgentId(params.slug),
    getUserSessionData(`Bearer ${cookies().get('session_key')?.value}`, 'customer'),
  ]);
  const { data: html } = promises[0];
  const agent: AgentData = promises[1];
  const user = promises[2] as unknown as { [key: string]: string };

  if (!agent?.agent_id) redirect(`/log-in`);
  if (!user || user.session_key !== cookies().get('session_key')?.value) redirect(`/${agent.agent_id}/${agent.metatags.profile_slug}/log-in`);

  if (html && agent) {
    const $: CheerioAPI = load(html);
    const nav = $('body .navbar---dashboard');
    $('body .navbar---dashboard').remove();
    replaceAgentFields($);
    const contents = $('body > div > div:not(.navbar---dashboard)');
    const records: SavedSearchOutput[] = await retrieveSavedSearches(Number(user.id));

    return (
      <>
        <NavIterator agent={agent}>{domToReact(nav as unknown as DOMNode[]) as React.ReactElement}</NavIterator>
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
