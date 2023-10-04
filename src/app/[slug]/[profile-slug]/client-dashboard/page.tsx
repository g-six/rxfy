import React from 'react';
import { DOMNode, domToReact } from 'html-react-parser';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import Container from './container.module';
import NavIterator from '@/components/Nav/RxNavIterator';
import { replaceAgentFields } from '@/app/property/page';

export const metadata = {
  title: 'Leagent Real Estate Dashboard',
};

export default async function ClientDashboard({ params }: { params: { [key: string]: string } }) {
  const { data: html } = await axios.get('https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/client-dashboard');
  const agent = await findAgentRecordByAgentId(params.slug);

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
        <NavIterator agent={agent}>{domToReact(nav as unknown as DOMNode[]) as React.ReactElement}</NavIterator>
        <Container agent={agent}>{domToReact(contents as unknown as DOMNode[]) as React.ReactElement}</Container>
      </main>
    );
  }
  return <></>;
}
