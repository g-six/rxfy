import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByProp } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, createElement, useEffect } from 'react';
import { SavedSearch } from '@/_typings/saved-search';

type Props = {
  child: ReactElement;
  alertData?: SavedSearch;
  resetClick: () => void;
  saveClick: () => void;
};

export default function SubmitGrid({ child, resetClick, saveClick }: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['ha-reset']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            resetClick();
          },
        }),
    },
    {
      searchFn: searchByClasses(['ha-setup']),
      transformChild: child =>
        createElement(
          'button',
          {
            className: child.props.className,
            onClick: () => {
              saveClick();
            },
          },
          child.props.children,
        ),
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
