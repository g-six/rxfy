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
import RxPropertyCardList from '@/components/RxCards/RxPropertyCardList';
import { queryStringToObject } from '@/_utilities/url-helper';
import HomeAlertButton from './home-alert-button.module';
import HomeAlert1 from './home-alert-1.module';
import HomeAlert2 from './home-alert-2.module';
import HomeAlert3 from './home-alert-3.module';
import MapSearchInput from './search-input.module';
import MapCanvas from './map-canvas.module';
import HomeList from './home-list.module';

import list_styles from './home-list.module.scss';

async function Iterator({ agent, children, city }: { children: React.ReactElement; agent?: AgentData; city?: string }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.props && typeof c.props.children === 'string') {
      if (c.props.children.includes('{Agent Name}')) {
        if (agent) {
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
        } else return React.cloneElement(c, c.props, ['Leagent']);
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
        else if (className.includes('property-card-map')) {
          return (
            <RxPropertyCardList {...props}>
              {React.cloneElement(c, {
                ...props,
                className: 'hidden',
                'tpl-classname': className,
              })}
            </RxPropertyCardList>
          );
        } else if (className.includes('map-filters')) {
          return (
            <div className={className} id={props.id}>
              <RxMapFilters
                agent-id={agent?.agent_id}
                agent-record-id={agent?.id}
                profile-slug={agent?.metatags?.profile_slug}
                agent-metatag-id={agent?.metatags?.id}
              >
                {props.children}
              </RxMapFilters>
            </div>
          );
        } else if (className.includes('listings-by-agent-field') && !agent) {
          return <></>;
        } else if (className.includes('all-properties')) {
          return <HomeList className={className}>{props.children}</HomeList>;
        } else if (className.includes('left-bar')) {
          return (
            <div className={[className, list_styles['left-bar']].join(' ')}>
              <Iterator city={city}>{props.children}</Iterator>
            </div>
          );
        } else if (className.includes('ha-icon')) {
          return <HomeAlertButton className={className}>{convertDivsToSpans(props.children)}</HomeAlertButton>;
        } else if (className.includes('ha-step-1')) {
          return <HomeAlert1 className={className}>{props.children}</HomeAlert1>;
        } else if (className.includes('ha-step-2')) {
          return <HomeAlert2 className={className}>{props.children}</HomeAlert2>;
        } else if (className.includes('ha-step-3')) {
          return <HomeAlert3 className={className}>{props.children}</HomeAlert3>;
        } else if (className.includes('mapbox-canvas')) {
          return <MapCanvas className={className}>{props.children}</MapCanvas>;
        }
      }
      // -->

      return (
        <div className={className || '' + ' rexified MapPage Iterator'} {...props}>
          <Iterator agent={agent} city={city}>
            {c.props.children}
          </Iterator>
        </div>
      );
    } else if (c.type === 'a') {
      return React.cloneElement(
        c,
        c.props,
        React.Children.map(c.props.children, cc => {
          if (!['img', 'span', 'svg'].includes(cc.type)) {
            return <Iterator agent={agent}>{React.cloneElement(<span />, cc.props)}</Iterator>;
          }
          return cc;
        }),
      );
    } else if (c.props?.children) {
      return React.cloneElement(c, {
        ...c.props,
        children: React.Children.map(c.props.children, cc => {
          return <Iterator agent={agent}>{convertDivsToSpans(cc)}</Iterator>;
        }),
      });
    } else if (c.type === 'input' && c.props && c.props.className?.includes('search-input-field')) {
      return <MapSearchInput {...c.props} keyword={city} />;
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default async function MapPage({ searchParams }: { params: { [key: string]: string }; searchParams: { [key: string]: string } }) {
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
          <Iterator agent={agent} city={searchParams.city}>
            {domToReact(body as unknown as DOMNode[]) as unknown as React.ReactElement}
          </Iterator>
        </>
      );
    }
  }
  return <>Page url is invalid or not found, please see app/map/page</>;
}
