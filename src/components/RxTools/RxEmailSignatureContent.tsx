import React, { ReactElement } from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { getAgentPhoto } from '@/_utilities/data-helpers/agent-helper';

export default function RxEmailSignatureContent({ nodes, agent }: ReplacerPageProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['agent-name-email']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          children: agent.full_name,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-title']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          children: agent.metatags.title,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-phone']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          children: agent.phone,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-email']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          children: agent.email,
          href: `mailto:${agent.email}`,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-url']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          children: agent.domain_name ? agent.domain_name : agent.webflow_domain,
          href: agent.domain_name ? agent.domain_name : agent.webflow_domain,
          target: '_blank',
          rel: 'noopener noreferrer',
        });
      },
    },
    {
      searchFn: searchByClasses(['facebook']),
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
      searchFn: searchByClasses(['twitter']),
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
      searchFn: searchByClasses(['linkedin']),
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
      searchFn: searchByClasses(['instagram']),
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
    {
      searchFn: searchByClasses(['email-agent-image']),
      transformChild: (child: ReactElement) => {
        const photo = getAgentPhoto(agent);
        return !photo ? <></> : React.cloneElement(child, { ...child.props, src: photo });
      },
    },
  ];

  return <>{transformMatchingElements(nodes, matches)}</>;
}
