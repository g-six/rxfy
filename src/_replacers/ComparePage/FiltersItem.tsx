import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

import React, { cloneElement, ReactElement } from 'react';

type Props = {
  item: {
    title: string;
    urlKey?: string;
    keys: string[];
    types: string[];
    behaviors?: string[];
  };
  isPicked: boolean;
  template: ReactElement;
  handleCheckList: () => void;
};

export default function FiltersItem({ item, template, isPicked, handleCheckList }: Props) {
  const handleCheckClick = () => {
    handleCheckList();
  };
  const matches = [
    {
      searchFn: searchByClasses(['checkbox']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          className: `${child.props.className}  ${isPicked ? 'w--redirected-checked' : ''}`,
        });
      },
    },
    {
      searchFn: searchByClasses(['checkbox-button-label']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { onClick: handleCheckClick, className: `${child.props.className} ` }, [item.title]);
      },
    },
  ];

  return <>{transformMatchingElements(template, matches)}</>;
}