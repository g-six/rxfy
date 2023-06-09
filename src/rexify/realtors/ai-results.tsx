'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

type Props = {
  children: React.ReactElement;
  className?: string;
};

export default function AiResult(p: Props) {
  const [loading, toggleLoading] = React.useState(false);

  const matches = [
    {
      searchFn: searchByClasses(['theme-area']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          className: 'hidden',
        });
      },
    },
  ];

  React.useEffect(() => {
    if (Cookies.get('session_key')) {
      toggleLoading(true);
    }
  }, []);

  return <div className={[p.className, 'w-full'].join(' ')}>{transformMatchingElements(p.children, matches)}</div>;
}
