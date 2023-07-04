import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { removeClasses } from '@/_helpers/functions';
import { SmartCardResponse } from '@/_typings/smart-cards';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';

type Props = { template: ReactElement; item: SmartCardResponse; onClick: () => void; isActive: boolean };

export default function SmartCard({ template, item, onClick, isActive }: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['f-testimonial-card']),
      transformChild: child =>
        cloneElement(child, { className: `${removeClasses(child.props.className, ['active'])} cursor-pointer ${isActive ? 'active' : ''}`, onClick }),
    },
    { searchFn: searchByClasses(['smart-card-name']), transformChild: child => cloneElement(child, {}, [`Leagent Card ${item.id}`]) },
    { searchFn: searchByClasses(['smart-card-agent-name']), transformChild: child => cloneElement(child, {}, item.name) },
    { searchFn: searchByClasses(['smart-card-agent-title']), transformChild: child => cloneElement(child, {}, item.title) },
  ];

  return template ? transformMatchingElements(template, matches) : <></>;
}
