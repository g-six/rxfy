import React from 'react';
import { DOMNode, domToReact } from 'html-react-parser';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import Container from './container.module';

export default async function ClientDashboard({ params }: { params: { [key: string]: string } }) {
  const { data: html } = await axios.get('https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/client-dashboard');
  const agent = await findAgentRecordByAgentId(params.slug);

  if (html && agent) {
    const $: CheerioAPI = load(html);
    $('.navbar-dashboard-wrapper [href]').each((i, el) => {
      let u = $(el).attr('href');
      if (u && u !== '#') {
        $(el).attr('href', `/${agent.agent_id}/${agent.metatags.profile_slug}${u}`);
      }
    });
    const body = $('body > div');
    return <Container agent={agent}>{domToReact(body as unknown as DOMNode[]) as React.ReactElement}</Container>;
  }
  return <></>;
}