import React from 'react';
import { DOMNode, domToReact } from 'html-react-parser';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import Container from './container.module';
import { AgentData } from '@/_typings/agent';
import { cookies } from 'next/headers';
import { classNames } from '@/_utilities/html-helper';
import NavIterator from '@/components/Nav/RxNavIterator';

export default async function MyDocuments({ params }: { params: { [key: string]: string } }) {
  const session_key = cookies().get('session_key')?.value;
  if (!cookies().get('session_key')) {
    return <>Access denied</>;
    // redirect(`/${params.slug}/${params['profile-slug']}/log-in`);
  }
  const promises = await Promise.all([axios.get('https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/my-documents'), findAgentRecordByAgentId(params.slug)]);
  const { data: html } = promises[0];
  const agent: AgentData = promises[1];

  if (html && agent && session_key) {
    const $: CheerioAPI = load(html);

    const navbar = $('body .navbar---dashboard');
    $('body .navbar---dashboard').remove();
    const body = $('body > div');
    return (
      <>
        <NavIterator agent={agent}>{domToReact(navbar as unknown as DOMNode[]) as React.ReactElement}</NavIterator>
        <Container agent={agent}>{domToReact(body as unknown as DOMNode[]) as React.ReactElement}</Container>;
      </>
    );
  }
  return <></>;
}
