import React from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';

export default function FooterSocialLinks({ nodes, agent, nodeProps, nodeClassName }: ReplacerPageProps) {
  const matches = [
    {
      searchFn: searchByClasses(['contact-form-close']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          href: '',
        }),
    },
  ];
  return <div className={nodeClassName}>{transformMatchingElements(nodes, matches)}</div>;
}
