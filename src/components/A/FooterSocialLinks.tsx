import React from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';

export default function FooterSocialLinks({ nodes, agent, nodeClassName }: ReplacerPageProps) {
  const matches = [
    {
      searchFn: searchByClasses(['footer-social-link-twitter']),
      transformChild: (child: React.ReactElement) => {
        const href = agent?.metatags?.twitter_url;
        return !href ? (
          <></>
        ) : (
          React.cloneElement(child, {
            ...child.props,
            href: href,
            target: '_blank',
            rel: 'noopener noreferrer',
          })
        );
      },
    },
    {
      searchFn: searchByClasses(['footer-social-link-linkedin']),
      transformChild: (child: React.ReactElement) => {
        const href = agent?.metatags?.linkedin_url;
        return !href ? (
          <></>
        ) : (
          React.cloneElement(child, {
            ...child.props,
            href: href,
            target: '_blank',
            rel: 'noopener noreferrer',
          })
        );
      },
    },
    {
      searchFn: searchByClasses(['footer-social-link-facebook']),
      transformChild: (child: React.ReactElement) => {
        const href = agent?.metatags?.facebook_url;
        return !href ? (
          <></>
        ) : (
          React.cloneElement(child, {
            ...child.props,
            href: href,
            target: '_blank',
            rel: 'noopener noreferrer',
          })
        );
      },
    },
    {
      searchFn: searchByClasses(['footer-social-link-instagram']),
      transformChild: (child: React.ReactElement) => {
        const href = agent?.metatags?.instagram_url;
        return !href ? (
          <></>
        ) : (
          React.cloneElement(child, {
            ...child.props,
            href: href,
            target: '_blank',
            rel: 'noopener noreferrer',
          })
        );
      },
    },
  ];
  return <div className={nodeClassName}>{transformMatchingElements(nodes, matches)}</div>;
}
