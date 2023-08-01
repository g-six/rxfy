import React from 'react';
import { classNames } from '@/_utilities/html-helper';
import { cookies } from 'next/headers';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { AgentData } from '@/_typings/agent';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

export default function NavIterator({ agent, children }: { children: React.ReactElement; agent?: AgentData }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      const { children: subchildren, ...props } = c.props;
      return (
        <div {...props} className={classNames(c.props.className || '', 'rexified', 'NavIterator-div')}>
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
      if (link_props?.className?.includes('-session')) {
        return (
          <a href={`/${agent?.agent_id}/${agent?.metatags.profile_slug}${href}`} {...link_props}>
            <NavIterator agent={agent}>{convertDivsToSpans(contents)}</NavIterator>
          </a>
        );
      } else if (link_props?.className?.includes('button')) {
        return React.cloneElement(<button type='button' />, link_props, contents);
      }
    }
    if (c.props?.className?.includes('logo')) {
      const logo = agent?.metatags?.logo_for_light_bg || agent?.metatags?.logo_for_dark_bg;
      if (logo) {
        return React.cloneElement(
          c,
          {
            ...c.props,
            style: {
              backgroundImage: `url(${getImageSized(logo, 100)})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              width: '100px',
              height: '1.8rem',
              display: 'inline-block',
            },
          },
          [<></>],
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
