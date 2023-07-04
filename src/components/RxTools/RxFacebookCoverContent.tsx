import React, { ReactElement } from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { getAgentPhoto } from '@/_utilities/data-helpers/agent-helper';

export default function RxFacebookCoverContent({ nodes, agent }: ReplacerPageProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['agent-name-fb']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: agent.full_name,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-phone']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: agent.phone,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-email']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: agent.email,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-url']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: agent.domain_name ? agent.domain_name : agent.webflow_domain,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-photo']),
      transformChild: (child: ReactElement) => {
        const photo = getAgentPhoto(agent);
        return !photo ? <></> : React.cloneElement(child, { ...child.props, src: photo });
      },
    },
  ];

  return <>{transformMatchingElements(nodes, matches)}</>;
}
