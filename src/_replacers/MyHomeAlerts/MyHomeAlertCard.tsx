import { replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events } from '@/_typings/events';
import { SavedSearch } from '@/_typings/saved-search';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  child: ReactElement;
  data: SavedSearch;
};

export default function MyHomeAlertCard({ child, data }: Props) {
  let dwelling_types: string[] = data.dwelling_types?.map(ptype => ptype.name) || [];

  const replace = {
    area: data.area || '',
    city: data.city || '',
    Title: `${data?.city} ${dwelling_types.length > 0 ? dwelling_types[0] : ''}`,
    'min-price': data.minprice ? getShortPrice(data.minprice, '') : 'Not Selected',
    'max-price': data.maxprice ? getShortPrice(data.maxprice, '') : 'Not Selected',
    beds: data.beds,
    baths: data.baths,
    'min-sqft': data?.minsqft ?? 'N/A',
    'max-sqft': data?.maxsqft ?? 'N/A',
    'listed-since': data.add_date ?? 'Not Selected',
    'prop-newer-than': data.build_year ?? 'Not Selected',
    keywords: data.tags ?? 'Not Provided',
    proptype: dwelling_types.length ? dwelling_types.join(', ') : 'Not Selected',
  };
  const handleEditClick = () => {
    fireCustomEvent({ show: true, message: 'Edit', alertData: data }, Events.MyHomeAlertsModal);
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['ha-delete-button']),
      transformChild: (child: ReactElement) => {
        return child;
      },
    },
    {
      searchFn: searchByClasses(['button-secondary']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { onClick: handleEditClick });
      },
    },
  ];

  return <>{transformMatchingElements(replaceAllTextWithBraces(child, replace), matches)}</>;
}
