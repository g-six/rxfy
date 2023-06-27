import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';

import React, { cloneElement, createElement, ReactElement } from 'react';

type Props = {
  item: {
    title: string;
  };
  isPicked: boolean;
  template: ReactElement;
  handleCheckList: () => void;
};

export default function Checkbox({ item, template, isPicked, handleCheckList }: Props) {
  const handleCheckClick = () => {
    handleCheckList();
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['w-checkbox-input']),
      transformChild: (child: ReactElement) => {
        const filtered = child.props.className
          .split(' ')
          .filter((cls: string) => cls.includes('inputType'))
          .join(' ');

        return createElement('div', {
          onClick: handleCheckClick,
          className: `${filtered} checkbox cursor-pointer ${isPicked ? 'w--redirected-checked' : ''}`,
        });
      },
    },
    {
      searchFn: searchByPartOfClass(['checkbox-button-label']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { onClick: handleCheckClick, style: { userSelect: 'none' }, className: `${child.props.className} ` }, [item.title]);
      },
    },
  ];

  return <>{transformMatchingElements(template, matches)}</>;
}
