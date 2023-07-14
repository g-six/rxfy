import React from 'react';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { DOMNode, domToReact } from 'html-react-parser';
import { headers } from 'next/headers';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import RxToggleSwitch from '@/components/RxPropertyMap/RxToggleSwitch';
import { findAgentRecordByAgentId } from '../api/agents/model';
import { AgentData } from '@/_typings/agent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import RxMapFilters from '@/components/RxMapFilters';

async function Iterator({ agent, children }: { children: React.ReactElement; agent?: AgentData }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.props && typeof c.props.children === 'string' && agent) {
      if (c.props.children.includes('{Agent Name}')) {
        const logo = agent.metatags.logo_for_light_bg || agent.metatags.logo_for_dark_bg;
        return React.cloneElement(
          c,
          {
            ...c.props,
            style:
              logo && c.props?.className.includes('logo')
                ? {
                    backgroundImage: `url(${getImageSized(logo, 140)})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'contain',
                    display: 'inline-block',
                    minHeight: '2.25rem',
                    minWidth: '8rem',
                    textIndent: '-100rem',
                  }
                : undefined,
          },
          [agent.metatags?.title || agent.full_name],
        );
      }
    } else if (['div', 'form', 'section'].includes(c.type as string)) {
      const { className, ...props } = c.props;

      // <-- Components
      if (className) {
        if (className.includes('toggle-base'))
          return React.cloneElement(<RxToggleSwitch />, {
            ...props,
            className: className || '' + ' rexified MapPage Iterator',
          });
        else if (className.includes('map-filters'))
          return (
            <div className={className} id={props.id}>
              <RxMapFilters
                agent-id={agent?.agent_id}
                agent-record-id={agent?.id}
                profile-slug={agent?.metatags?.profile_slug}
                agent-metatag-id={agent?.metatags?.id}
              >
                {c.props.children}
              </RxMapFilters>
            </div>
          );
      }
      // -->

      return (
        <div className={className || '' + ' rexified MapPage Iterator'} {...props}>
          <Iterator agent={agent}>{c.props.children}</Iterator>
        </div>
      );
    } else if (c.props?.children) {
      return React.cloneElement(c, {
        ...c.props,
        children: React.Children.map(c.props.children, cc => {
          return <Iterator agent={agent}>{convertDivsToSpans(cc)}</Iterator>;
        }),
      });
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default async function MapPage(p: unknown) {
  const slug = headers().get('x-profile-slug');
  const agent_id = headers().get('x-agent-id');
  const url = headers().get('x-url');
  let agent;

  // <--- Fill up agent info (if any)
  if (slug && agent_id) {
    agent = await findAgentRecordByAgentId(agent_id);
  }
  // --->

  if (url) {
    let time = Date.now();
    const { data: html } = await axios.get(url);
    if (html) {
      console.log(Date.now() - time + 'ms', 'Finished pulling html data');
      const $: CheerioAPI = load(html);
      console.log(Date.now() - time + 'ms', 'Finished loading pulled html');
      const body = $('body > div');
      console.log(Date.now() - time + 'ms', 'Finished extracting body div');
      return (
        <>
          <Iterator agent={agent}>{domToReact(body as unknown as DOMNode[]) as unknown as React.ReactElement}</Iterator>
        </>
      );
    }
  }
  return <>Page url is invalid or not found, please see app/map/page</>;
}
