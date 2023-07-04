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
          children: agent?.metatags?.title || '',
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
        return React.cloneElement(<a />, {
          ...child.props,
          children: agent.email,
          href: `mailto:${agent.email}`,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-url']),
      transformChild: (child: React.ReactElement) => {
        let website_display = agent.domain_name;
        if (!website_display) website_display = `${agent.agent_id}/${agent.metatags.profile_slug}`;
        return React.cloneElement(<a />, {
          ...child.props,
          children: `${location.hostname}/${website_display}`,
          href: `${location.origin}/${website_display}`,
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
          React.cloneElement(<a />, {
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
          React.cloneElement(<a />, {
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
          React.cloneElement(<a />, {
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
          React.cloneElement(<a />, {
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
