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

export default async function MyHomeAlerts({ params }: { params: { [key: string]: string } }) {
  if (!cookies().get('session_key')?.value) redirect(`log-in`);

  const promises = await Promise.all([
    axios.get('https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/my-home-alerts'),
    findAgentRecordByAgentId(params.slug),
    getUserSessionData(`Bearer ${cookies().get('session_key')?.value}`, 'customer'),
  ]);
  const { data: html } = promises[0];
  const agent: AgentData = promises[1];
  const user = promises[2];

  if (!agent?.agent_id) redirect(`/log-in`);
  if (!user) redirect(`/${agent.agent_id}/${agent.metatags.profile_slug}/log-in`);

  if (html) {
    const $: CheerioAPI = load(html);
    if (agent) {
      $('.navbar-dashboard-wrapper [href]').each((i, el) => {
        let u = $(el).attr('href');
        if (u && u !== '#') {
          $(el).attr('href', `/${agent.agent_id}/${agent.metatags.profile_slug}${u}`);
        }
      });
      $('.logo-div h3').each((i, el) => {
        let u = $(el).attr('href');
        const { logo_for_light_bg, logo_for_dark_bg } = agent.metatags;
        let logo = logo_for_light_bg || logo_for_dark_bg;
        if (logo) {
          logo = getImageSized(logo, 100);
          $(el).replaceWith(
            `<span class="inline-block rounded bg-no-repeat bg-contain w-full" style="background-image: url(${logo}); display: block; width: 100px; height: 3rem;"></span>`,
          );
        } else {
          $(el).replaceWith(agent.full_name);
        }
      });
      const body = $('body > div');
      return <Container agent={agent}>{domToReact(body as unknown as DOMNode[]) as React.ReactElement}</Container>;
    }
    return <>{html}</>;
  }
}
