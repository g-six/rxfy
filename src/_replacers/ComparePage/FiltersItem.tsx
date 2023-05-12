import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';

import React, { cloneElement, ReactElement } from 'react';

type Props = {
  item: {
    title: string;
  };
  isPicked: boolean;
  template: ReactElement;
  handleCheckList: () => void;
};

export default function FiltersItem({ item, template, isPicked, handleCheckList }: Props) {
  const handleCheckClick = () => {
    handleCheckList();
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['checkbox']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: handleCheckClick,
          className: `${child.props.className} cursor-pointer ${isPicked ? 'w--redirected-checked' : ''}`,
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
