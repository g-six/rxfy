import React from 'react';
import { DOMNode, domToReact } from 'html-react-parser';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import Container from './container.module';
import NavIterator from '@/components/Nav/RxNavIterator';

export default async function ClientDashboard({ params }: { params: { [key: string]: string } }) {
  const { data: html } = await axios.get('https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/client-dashboard');
  const agent = await findAgentRecordByAgentId(params.slug);

  if (html && agent) {
    const $: CheerioAPI = load(html);
    const nav = $('body .navbar---dashboard');
    $('body .navbar---dashboard').remove();
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
