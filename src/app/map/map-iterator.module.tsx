import React, { cloneElement } from 'react';
import { AgentData } from '@/_typings/agent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import RxMapFilters from '@/components/RxMapFilters';
import RxToggleSwitch from '@/components/RxPropertyMap/RxToggleSwitch';
import RxPropertyCardList from '@/components/RxCards/RxPropertyCardList';
import HomeAlertButton from './home-alert-button.module';
import HomeAlert1 from './home-alert-1.module';
import HomeAlert2 from './home-alert-2.module';
import HomeAlert3 from './home-alert-3.module';
import MapSearchInput from './search-input.module';
import MapCanvas from './map-canvas.module';
import HomeList from './home-list.module';

import list_styles from './home-list.module.scss';
import AgentListingsToggle from './agent-listing-toggle.module';
import HeartToggle from './heart-toggle.module';
import PropertyCardSm from './property-card-sm.module';
import { classNames } from '@/_utilities/html-helper';

import styles from './styles.module.scss';
import NavIterator from '@/components/Nav/RxNavIterator';
import { LoveDataModel } from '@/_typings/love';
import { PropertyDataModel } from '@/_typings/property';
import { headers } from 'next/headers';
import Navbar from '../navbar.module';

function getAgentLogo(logo: string, default_src: string) {
  if (logo) return getImageSized(logo, 300);
  return default_src;
}

export default async function MapIterator({
  children,
  ...attributes
}: {
  children: React.ReactElement;
  agent?: AgentData;
  city?: string;
  loves?: LoveDataModel[];
  properties?: PropertyDataModel[];
}) {
  const { agent, city } = attributes;
  const Wrapped = React.Children.map(children, c => {
    if (c.props?.['data-field']) {
      const data = agent as unknown as {
        [k: string]: string;
      };
      let value = c.props['data-field'] === 'agent_name' ? agent?.full_name : data[c.props['data-field']];
      return c.type !== 'img' ? cloneElement(c, {}, value) : <></>;
    } else if (c.props && typeof c.props.children === 'string') {
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
                      backgroundImage: `url(${getImageSized(logo, 140)}?v=${agent.metatags.last_updated_at})`,
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
    } else if (c.type === 'nav') {
      const { children: nav_items, ...nav_props } = c.props;
      return (
        <nav {...nav_props}>
          <NavIterator agent={agent}>{nav_items}</NavIterator>
        </nav>
      );
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
        } else if (className.includes('listings-by-agent-field')) {
          return agent ? (
            <AgentListingsToggle agent={agent} className={className}>
              {props.children}
            </AgentListingsToggle>
          ) : (
            <></>
          );
        } else if (className.includes('all-properties')) {
          return (
            <HomeList agent={agent} className={className}>
              {props.children}
            </HomeList>
          );
        } else if (className.includes('left-bar')) {
          return (
            <div className={[className, list_styles['left-bar']].join(' ')}>
              <MapIterator {...attributes}>{props.children}</MapIterator>
            </div>
          );
        } else if (className.includes('ha-icon')) {
          return <HomeAlertButton className={className}>{convertDivsToSpans(props.children)}</HomeAlertButton>;
        } else if (className.includes('ha-step-1')) {
          return (
            <HomeAlert1 agent={agent?.id} className={className}>
              {props.children}
            </HomeAlert1>
          );
        } else if (className.includes('ha-step-2')) {
          return <HomeAlert2 className={className}>{props.children}</HomeAlert2>;
        } else if (className.includes('ha-step-3')) {
          return <HomeAlert3 className={className}>{props.children}</HomeAlert3>;
        } else if (className.includes('property-card-small')) {
          return (
            <PropertyCardSm agent={agent?.id || 0} className={className}>
              {props.children}
            </PropertyCardSm>
          );
        } else if (className.includes('mapbox-canvas')) {
          return (
            <MapCanvas agent={agent} className={className} {...attributes}>
              {props.children}
            </MapCanvas>
          );
        } else if (className.includes('map-navbar')) {
          return (
            <nav className={classNames(className, styles.navbar, 'rexified')} {...props}>
              <NavIterator agent={agent}>{props.children}</NavIterator>
            </nav>
          );
        }
      }
      // -->

      return (
        <div {...props} className={className || '' + ` had-${c.props.children.length}` + ' rexified MapPage Iterator'}>
          <MapIterator {...attributes}>{c.props.children}</MapIterator>
        </div>
      );
    } else if (c.type === 'a') {
      if (c.props?.className.includes('heart-button')) {
        return (
          <HeartToggle records={attributes.loves} className={c.props.className}>
            {c.props.children}
          </HeartToggle>
        );
      }
      // Turn this on if you wish to debug agent's headers
      // headers().forEach((val, key) => {
      //   console.log({
      //     key,
      //     val,
      //   });
      // });
      let { href } = c.props;
      const { pathname } = new URL(headers().get('referer') as string);
      const agent_base_path = `/${headers().get('x-agent-id')}/${headers().get('x-profile-slug')}`;
      if (pathname.indexOf(agent_base_path) === 0) {
        href = agent_base_path;
      }
      return React.cloneElement(
        c,
        {
          href,
        },
        React.Children.map(c.props.children, cc => {
          if (!['img', 'span', 'svg', 'div'].includes(cc.type)) {
            if (cc.type === 'div') return <MapIterator {...attributes}>{cc.props.children}</MapIterator>;
            return <MapIterator {...attributes}>{React.cloneElement(<span data-class={cc.type} />, cc.props)}</MapIterator>;
          }
          if (cc.props.children) {
            return <MapIterator {...attributes}>{cc.props.children}</MapIterator>;
          }
          if (cc.type === 'img' && cc.props['data-field']) {
            switch (cc.props['data-field']) {
              case 'logo_for_dark_bg':
                return cloneElement(cc, { src: getAgentLogo(agent?.metatags?.logo_for_dark_bg || agent?.metatags?.logo_for_light_bg || '', cc.props.src) });
              case 'logo_for_light_bg':
                return cloneElement(cc, { src: getAgentLogo(agent?.metatags?.logo_for_light_bg || agent?.metatags?.logo_for_dark_bg || '', cc.props.src) });
            }
          }
          return cc;
        }),
      );
    } else if (c.props?.children) {
      return React.cloneElement(c, {
        ...c.props,
        children: React.Children.map(c.props.children, cc => {
          return <MapIterator {...attributes}>{convertDivsToSpans(cc)}</MapIterator>;
        }),
      });
    } else if (c.type === 'input' && c.props && c.props.className?.includes('search-input-field')) {
      return <MapSearchInput {...c.props} keyword={city} />;
    }
    return c;
  });
  return <>{Wrapped}</>;
}
