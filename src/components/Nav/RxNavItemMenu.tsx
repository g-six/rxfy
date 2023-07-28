'use client';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import Cookies from 'js-cookie';
import React from 'react';

type Props = {
  children: React.ReactElement[];
  className?: string;
};

export default function RxNavItemMenu(p: Props) {
  const [is_opened, toggleOpen] = React.useState(false);
  const { children } = p;

  const handleClick = (e: React.MouseEvent) => {
    toggleOpen(!is_opened);
  };

  const matches = [
    {
      searchFn: searchByClasses(['w-dropdown-toggle']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${is_opened ? 'w--open' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['w-dropdown-list']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          children: React.Children.map(child.props.children, child => {
            if (child.type === 'div') {
              return <RxNavItemMenu {...child.props}>{child.props.children}</RxNavItemMenu>;
            }
          }),
          className: `${is_opened ? 'w--open' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['w-dropdown-link', 'out-session']),
      transformChild: (child: React.ReactElement) => {
        return Cookies.get('session_key') ? <></> : child;
      },
    },
    {
      searchFn: searchByClasses(['w-dropdown-link', WEBFLOW_NODE_SELECTOR.USER_MENU]),
      transformChild: (child: React.ReactElement) => {
        return Cookies.get('session_key') ? child : <></>;
      },
    },
    {
      searchFn: searchByClasses(['w-icon-dropdown-toggle']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${is_opened ? 'rotate-180' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
  ];

  return (
    <div {...p} className={`${is_opened ? 'w--open z-[991]' : ''} ${p.className || ''} rexified`.trim()}>
      {transformMatchingElements(children, matches)}
    </div>
  );
}
