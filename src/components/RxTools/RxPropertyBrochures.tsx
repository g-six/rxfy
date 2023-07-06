'use client';
import React from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { getAgentMapDefaultUrl } from '@/_utilities/data-helpers/agent-helper';

export default function RxPropertyBrochures({ nodes, agent }: ReplacerPageProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['go-to-map']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          href: getAgentMapDefaultUrl(agent),
        });
      },
    },
  ];
  return <>{transformMatchingElements(nodes, matches)}</>;
}
