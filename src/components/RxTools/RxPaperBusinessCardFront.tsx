import React from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

export default function RxPaperBusinessCardFront({ nodes, agent }: ReplacerPageProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['agent-name-back']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: agent.full_name,
        });
      },
    },
    {
      searchFn: searchByClasses(['agent-title-back']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          children: agent.metatags.title,
        });
      },
    },
  ];
  return <>{transformMatchingElements(nodes, matches)}</>;
}
