import React, { cloneElement } from 'react';
import { classNames } from '@/_utilities/html-helper';
import { cookies } from 'next/headers';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { AgentData } from '@/_typings/agent';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { objectToQueryString } from '@/_utilities/url-helper';
import RequestInfoPopup from '@/app/property/request-info-popup.module';
import { getAgentBaseUrl } from '@/app/api/_helpers/agent-helper';

export default function NavIterator({ children, ...props }: { children: React.ReactElement; agent?: AgentData }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      const { children: subchildren, ...subprops } = c.props;
      let className: string = subprops.className || '';
      className = className
        .split(' ')
        .filter(cn => cn !== 'w-nav')
        .join(' ');
      if (subprops['data-popup']) {
        return (
          <RequestInfoPopup
            {...subprops}
            send_to={{
              email: props.agent?.email,
              name: props.agent?.full_name,
            }}
          >
            {subchildren}
          </RequestInfoPopup>
        );
      }
      return (
        <div {...subprops} className={classNames(className || '', 'rexified', 'NavIterator-div')}>
          <NavIterator {...props}>{subchildren}</NavIterator>
        </div>
      );
    }
    if (c.type === 'nav') {
      const { children: subchildren, ...subprops } = c.props;
      return (
        <nav {...subprops} className={classNames(c.props.className || '', 'z-30', 'rexified', 'NavIterator-nav')}>
          <NavIterator {...props}>{subchildren}</NavIterator>
        </nav>
      );
    }
    if (c.type === 'ul') {
      const { children: li, ...subprops } = c.props;
      return (
        <ul {...subprops} className={classNames(c.props.className || '', 'rexified', 'NavIterator-ul')}>
          {React.Children.map(li, cc => (
            <li {...cc.props} className={classNames(cc.props.className || '', 'rexified', 'NavIterator-li')}>
              <NavIterator {...props}>{cc.props.children}</NavIterator>
            </li>
          ))}
        </ul>
      );
    }
    if (c.type === 'a') {
      if (cookies().has('session_key') && c.props.className?.includes(WEBFLOW_NODE_SELECTOR.GUEST_MENU)) return <></>;
      if (!cookies().has('session_key') && c.props.className?.includes(WEBFLOW_NODE_SELECTOR.USER_MENU)) return <></>;
      const { href, children: contents, ...link_props } = c.props;
      link_props['rx-component'] = 'Nav.RxNavIterator';
      if (href.indexOf('tel:') === 0) return c;
      if (href !== '/log-out' && link_props['data-usertype']) {
        return (
          <a {...link_props} data-original-href={href} href={`/${props.agent?.agent_id}/${props.agent?.metatags.profile_slug}${href}`}>
            <NavIterator {...props}>{convertDivsToSpans(contents)}</NavIterator>
          </a>
        );
      } else if (link_props?.className?.includes('button')) {
        return React.cloneElement(<button type='button' />, link_props, contents);
      } else if (href.includes('/log-out')) {
        return cloneElement(c, {
          href: `${href}?user-type=${link_props['data-usertype']}&redirect=${`/${props.agent?.agent_id}/${props.agent?.metatags.profile_slug}`}`,
        });
      } else if (href === '/map') {
        return (
          <a
            {...link_props}
            data-original-href={href}
            href={`${props.agent && getAgentBaseUrl(props.agent)}${href}${
              props.agent?.metatags.geocoding
                ? `?${objectToQueryString(props.agent?.metatags.geocoding as unknown as { [k: string]: string })}`
                : '?nelat=49.34023817805203&nelng=-122.79116520440928&swlat=49.111312957626524&swlng=-123.30807516134138&lat=49.22590814575915&lng=-123.0496201828758&city=Vancouver&zoom=11'
            }`}
          >
            <NavIterator {...props}>{convertDivsToSpans(contents)}</NavIterator>
          </a>
        );
      } else if (!href.includes('/map') && !href.includes('log-out')) {
        return (
          <a {...link_props} data-original-href={href} href={`${props.agent && !props.agent.domain_name ? getAgentBaseUrl(props.agent) : ''}${href}`}>
            <NavIterator {...props}>{convertDivsToSpans(contents)}</NavIterator>
          </a>
        );
      }
    }
    if (c.props?.['data-field'] === 'agent_name') {
      return React.cloneElement(c, {}, props.agent?.full_name);
    }
    if (c.props?.['data-field'] === 'logo' || c.props?.['data-field'] === 'logo_for_light_bg') {
      const logo = props.agent?.metatags?.logo_for_light_bg || props.agent?.metatags?.logo_for_dark_bg;
      if (logo) {
        if (c.type !== 'img')
          return React.cloneElement(
            c,
            {
              style: {
                backgroundImage: `url(${getImageSized(logo, 100)}?v=${props.agent?.metatags.last_updated_at})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                width: '100px',
                height: '3rem',
                display: 'inline-block',
              },
            },
            [<></>],
          );
        else return React.cloneElement(c, { src: getImageSized(logo, 100), style: { maxHeight: '2.2rem' } });
      } else {
        if (c.type === 'img')
          return (
            <h6 className={c.props.className + ' agent-name-logo'} style={{ display: 'block' }} data-field={c.props['data-field']}>
              {props.agent?.full_name}
            </h6>
          );
      }
    }
    if (typeof c.props?.children === 'string') {
      if (c.props.children === '{Agent Name}') {
      }
    }
    return c;
  });
  return <>{Wrapped}</>;
}
