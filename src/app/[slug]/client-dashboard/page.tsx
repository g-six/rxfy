import React from 'react';
import { DOMNode, domToReact } from 'html-react-parser';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import Container from './container.module';
import NavIterator from '@/components/Nav/RxNavIterator';
import { replaceAgentFields } from '@/app/property/page.helpers';

export const metadata = {
  title: 'Leagent Real Estate Dashboard',
};

export default async function ClientDashboard({ params }: { params: { [key: string]: string } }) {
  const agent = await findAgentRecordByAgentId(params.slug);
  let url = 'https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/client-dashboard';
  if (agent.webflow_domain) {
    url = `https://sites.leagent.com/${agent.webflow_domain}/client-dashboard.html`;
  }
  const { data: html } = await axios.get(url);

  if (html && agent) {
    const $: CheerioAPI = load(html);
    const nav = $('body .navbar---dashboard');
    $('body .navbar---dashboard').remove();
    $('[data-field="financial_info"]').each((i, el) => {
      if (i > 0) $(el).remove();
    });
    $('[data-field="construction_info"]').each((i, el) => {
      if (i > 0) $(el).remove();
    });
    $('[data-field="feature_block"]').each((i, el) => {
      if (i > 0) $(el).remove();
    });

    replaceAgentFields($);

    const contents = $('body > div > div:not(.navbar---dashboard)');
    return (
      <main className={$('body > div').attr('class')}>
        {!agent.webflow_domain || agent.webflow_domain.includes('leagent') ? (
          <NavIterator agent={agent}>{domToReact(nav as unknown as DOMNode[]) as React.ReactElement}</NavIterator>
        ) : (
          (domToReact(nav as unknown as DOMNode[]) as React.ReactElement)
        )}
        <Container agent={agent}>{domToReact(contents as unknown as DOMNode[]) as React.ReactElement}</Container>
      </main>
    );
  }
  return <></>;
}
