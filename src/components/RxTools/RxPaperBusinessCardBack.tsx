import React from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

export default function RxPaperBusinessCardFrontBack({ nodes, agent }: ReplacerPageProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['agent-name-front']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, { children: agent.full_name });
      },
    },
    {
      searchFn: searchByClasses(['agent-title-front']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, { children: agent.metatags.title });
      },
    },
    {
      searchFn: searchByClasses(['agent-email']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, { children: agent.email });
      },
    },
    {
      searchFn: searchByClasses(['agent-phone']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, { children: agent.phone });
      },
    },
    {
      searchFn: searchByClasses(['agent-url-card']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, { children: agent.domain_name ? agent.domain_name : agent.webflow_domain });
      },
    },
    {
      searchFn: searchByClasses(['agent-logo']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, { src: agent?.metatags?.logo_for_dark_bg || agent?.metatags?.logo_for_light_bg });
      },
    },
  ];
  return <>{transformMatchingElements(nodes, matches)}</>;
}
