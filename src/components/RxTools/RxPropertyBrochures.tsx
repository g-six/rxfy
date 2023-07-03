import React from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

export default function RxPropertyBrochures({ nodes, agent }: ReplacerPageProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['go-to-map']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          href: (agent.webflow_domain ? agent.webflow_domain : '') + '/map',
        });
      },
    },
  ];
  return <>{transformMatchingElements(nodes, matches)}</>;
}
