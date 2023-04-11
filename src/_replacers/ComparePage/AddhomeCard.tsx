import { BracesReplacements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { removeClasses } from '@/_helpers/functions';
import { MLSPropertyExtended } from '@/_typings/filters_compare';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { cloneElement, ReactElement } from 'react';

type Props = {
  picked: Boolean;
  child: ReactElement;
  replacements: BracesReplacements;
  property: MLSPropertyExtended;
  onClick: (p: MLSPropertyExtended) => void;
};

function AddhomeCard({ child, property, picked, replacements, onClick }: Props) {
  const matches = [
    {
      searchFn: searchByClasses(['property-card-map']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, {
          ...child.props,
          className: classNames(removeClasses(child.props.className, ['selected']), picked ? 'selected' : ''),
          onClick: onClick,
        });
      },
    },
    {
      searchFn: searchByClasses(['propcard-image']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, { ...child.props, style: { backgroundImage: `url(${property.photos[0]})` } });
      },
    },
    {
      searchFn: searchByClasses(['checked-icon']),
      transformChild: (child: React.ReactElement) => {
        return cloneElement(child, { ...child.props, style: { opacity: `${picked ? 1 : 0}` } });
      },
    },
  ];
  return <div>{transformMatchingElements(replaceAllTextWithBraces(child, replacements), matches)}</div>;
}

export default AddhomeCard;
