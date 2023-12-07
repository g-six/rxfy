import React from 'react';
import { DOMNode, domToReact } from 'html-react-parser';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import { CheerioAPI, load } from 'cheerio';
import Container from './container.module';
import { AgentData } from '@/_typings/agent';
import { cookies, headers } from 'next/headers';
import { consoler } from '@/_helpers/consoler';

const FILE = 'my-documents/page.tsx';
export default async function MyDocuments({ params }: { params: { [key: string]: string }; searchParams?: { [key: string]: string } }) {
  const session_key = cookies().get('session_key')?.value;
  let path = '/my-documents';
  if (!cookies().get('session_key')) {
    path = '/access-denied';
  }
  const url = headers().get('x-url') || `${'https://' + WEBFLOW_DASHBOARDS.CUSTOMER + path}`;

  const promises = await Promise.all([axios.get(url), findAgentRecordByAgentId(params.slug)]);
  const { data: html } = promises[0];
  const agent: AgentData = promises[1];

  if (html && agent && session_key) {
    const $: CheerioAPI = load(html);

    const dropdown_class = $('.doc-3dots-dropdown').attr('class');
    const dropdown_icon = $('.doc-3dots-dropdown').html();
    const dropdown_container = $('.doc-3dots-dropdown + nav').html();
    const container_class = $('.doc-3dots-dropdown + nav').attr('class');
    $('.doc-3dots-dropdown + nav').remove();
    $('.doc-3dots-dropdown').replaceWith(
      '<div data-group="folder_actions" class="' +
        dropdown_class +
        '">' +
        dropdown_icon +
        '<nav class="' +
        container_class +
        '">' +
        dropdown_container +
        '</nav></div>',
    );
    let body = $('body > div:first-child');
    return <Container agent={agent}>{domToReact(body as unknown as DOMNode[]) as React.ReactElement}</Container>;
  }
  return <></>;
}
