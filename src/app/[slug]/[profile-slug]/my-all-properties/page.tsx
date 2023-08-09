import React from 'react';
import { DOMNode, domToReact } from 'html-react-parser';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import NavIterator from '@/components/Nav/RxNavIterator';
import MapIterator from '@/app/map/map-iterator.module';

export default async function MyAllProperties({ params }: { params: { [key: string]: string } }) {
  const { data: html } = await axios.get('https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/my-all-properties');
  const agent = await findAgentRecordByAgentId(params.slug);

  if (html && agent) {
    const $: CheerioAPI = load(html);
    const nav = $('body > div > .navbar---dashboard');
    const contents = $('body > div > .w-layout-grid');
    return (
      <div className={$('body > div').attr('class')}>
        <NavIterator agent={agent}>{domToReact(nav as unknown as DOMNode[]) as React.ReactElement}</NavIterator>
        <MapIterator agent={agent}>{domToReact(contents as unknown as DOMNode[]) as React.ReactElement}</MapIterator>
      </div>
    );
  }
  return <></>;
}
