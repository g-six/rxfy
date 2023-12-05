import React from 'react';
import axios from 'axios';
import { WEBFLOW_DASHBOARDS } from '@/_typings/webflow';
import { CheerioAPI, load } from 'cheerio';
import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import { DOMNode, domToReact } from 'html-react-parser';
import { findAgentRecordByAgentId } from '@/app/api/agents/model';
import NavIterator from '@/components/Nav/RxNavIterator';
import Form from './form-input.module';
import ActionButton from './action-button.module';
import RxNotifications from '@/components/RxNotifications';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { consoler } from '@/_helpers/consoler';

function Iterator({ children, agent }: { children: React.ReactElement; agent: AgentData }) {
  const Wrapped = React.Children.map(children, c => {
    if (['div', 'nav', 'form'].includes(c.type as string)) {
      const { children: contents, className, ...props } = c.props;
      const css = classNames(className, 'rexified', 'child-of', 'ClientMyProfile');
      if (c.type === 'div') {
        return (
          <div {...props} className={css}>
            {css.includes('navbar---dashboard') ? <NavIterator agent={agent}>{contents}</NavIterator> : <Iterator agent={agent}>{contents}</Iterator>}
          </div>
        );
      }
      if (c.type === 'nav') {
        return (
          <nav {...props} className={css}>
            <Iterator agent={agent}>{contents}</Iterator>
          </nav>
        );
      }
      if (c.type === 'form') {
        return (
          <div rx-tag='form' {...props} className={css}>
            <Form agent={agent}>{contents}</Form>
          </div>
        );
      }
    } else if (c.type === 'a') {
      const { href, children: contents, ...props } = c.props;
      if (typeof contents === 'string') {
        return (
          <ActionButton {...props} type='button'>
            {contents}
          </ActionButton>
        );
      }
      return (
        <a href={`/${agent.agent_id}/${agent.metatags.profile_slug}${href}`} {...props}>
          <Iterator agent={agent}>{convertDivsToSpans(contents)}</Iterator>
        </a>
      );
    }
    return c;
  });

  return <>{Wrapped}</>;
}

const FILE = '[slug]/[profile-slug]/my-profile/page.tsx';
export default async function ClientMyProfile({ params, searchParams }: { params: { [key: string]: string }; searchParams: { [key: string]: string } }) {
  if (!cookies().get('session_key') && searchParams?.key) {
    consoler(FILE, { searchParams });
    // redirect(`/${params.slug}/${params['profile-slug']}/log-in`);
  }
  const url = headers().get('x-url') || 'https://' + WEBFLOW_DASHBOARDS.CUSTOMER + '/my-profile';
  const { data: html } = await axios.get(url);

  const agent = await findAgentRecordByAgentId(params.slug);

  if (html && agent) {
    const $: CheerioAPI = load(html);
    const body = $('body > div');
    return (
      <>
        <Iterator agent={agent}>{domToReact(body as unknown as DOMNode[]) as unknown as React.ReactElement}</Iterator>;
        <RxNotifications />
      </>
    );
  }
  return <>Please log in</>;
}
