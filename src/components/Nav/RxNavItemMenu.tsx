'use client';
import { replaceElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React from 'react';

type Props = {
  children: React.ReactElement[];
  className?: string;
};

export default function RxNavItemMenu(p: Props) {
  const [is_opened, toggleOpen] = React.useState(false);
  const { children } = p;

  const handleClick = (e: React.MouseEvent) => {
    toggleOpen(!is_opened);
  };

  const matches = [
    {
      searchFn: searchByClasses(['w-dropdown-toggle']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${is_opened ? 'w--open' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['w-dropdown-list']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${is_opened ? 'w--open' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['w-icon-dropdown-toggle']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          className: `${is_opened ? 'rotate-180' : ''} ${child.props.className}`.trim(),
          onClick: handleClick,
        });
      },
    },
  ];

  return (
    <div {...p} className={`${is_opened ? 'w--open z-[991]' : ''} ${p.className || ''} rexified`.trim()}>
      {transformMatchingElements(children, matches)}
    </div>
  );
}
