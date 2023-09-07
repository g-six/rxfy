import React from 'react';
import { classNames } from '@/_utilities/html-helper';
import { cookies } from 'next/headers';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { AgentData } from '@/_typings/agent';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { objectToQueryString } from '@/_utilities/url-helper';

export default function NavIterator({ agent, children }: { children: React.ReactElement; agent?: AgentData }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      const { children: subchildren, ...props } = c.props;
      let className: string = props.className || '';
      className = className
        .split(' ')
        .filter(cn => cn !== 'w-nav')
        .join(' ');
      return (
        <div {...props} className={classNames(className || '', 'rexified', 'NavIterator-div')}>
          <NavIterator agent={agent}>{subchildren}</NavIterator>
        </div>
      );
    }
    if (c.type === 'nav') {
      const { children: subchildren, ...props } = c.props;
      return (
        <nav {...props} className={classNames(c.props.className || '', 'z-30', 'rexified', 'NavIterator-nav')}>
          <NavIterator agent={agent}>{subchildren}</NavIterator>
        </nav>
      );
    }
    if (c.type === 'ul') {
      const { children: li, ...props } = c.props;
      return (
        <ul {...props} className={classNames(c.props.className || '', 'rexified', 'NavIterator-ul')}>
          {React.Children.map(li, cc => (
            <li {...cc.props} className={classNames(cc.props.className || '', 'rexified', 'NavIterator-li')}>
              <NavIterator agent={agent}>{cc.props.children}</NavIterator>
            </li>
          ))}
        </ul>
      );
    }
    if (c.type === 'a') {
      if (cookies().has('session_key') && c.props.className?.includes(WEBFLOW_NODE_SELECTOR.GUEST_MENU)) return <></>;
      if (!cookies().has('session_key') && c.props.className?.includes(WEBFLOW_NODE_SELECTOR.USER_MENU)) return <></>;
      const { href, children: contents, ...link_props } = c.props;

      if (link_props?.className?.includes('-session') || href.includes('/my-') || href.includes('dashboard')) {
        return (
          <a {...link_props} data-original-href={href} href={`/${agent?.agent_id}/${agent?.metatags.profile_slug}${href}`}>
            <NavIterator agent={agent}>{convertDivsToSpans(contents)}</NavIterator>
          </a>
        );
      } else if (link_props?.className?.includes('button')) {
        return React.cloneElement(<button type='button' />, link_props, contents);
      } else if (href === '/map') {
        return (
          <a
            {...link_props}
            data-original-href={href}
            href={`/${agent?.agent_id}/${agent?.metatags.profile_slug}${href}${
              agent?.metatags.geocoding ? `?${objectToQueryString(agent?.metatags.geocoding as unknown as { [k: string]: string })}` : ''
            }`}
          >
            <NavIterator agent={agent}>{convertDivsToSpans(contents)}</NavIterator>
          </a>
        );
      } else {
        return (
          <a {...link_props} data-original-href={href} href={`/${agent?.agent_id}/${agent?.metatags.profile_slug}${href}`}>
            <NavIterator agent={agent}>{convertDivsToSpans(contents)}</NavIterator>
          </a>
        );
      }
    }
    if (c.props?.['data-field'] === 'agent_name') {
      return React.cloneElement(c, {}, agent?.full_name);
    }
    if (c.props?.['data-field'] === 'logo') {
      const logo = agent?.metatags?.logo_for_light_bg || agent?.metatags?.logo_for_dark_bg;
      if (logo) {
        return React.cloneElement(
          c,
          {
            ...c.props,
            style: {
              backgroundImage: `url(${getImageSized(logo, 100)}?v=${agent.metatags.last_updated_at})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              width: '100px',
              height: '3rem',
              display: 'inline-block',
            },
          },
          [<></>],
        );
      } else {
        return <h1 className={c.props.className}>{agent?.full_name}</h1>;
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
