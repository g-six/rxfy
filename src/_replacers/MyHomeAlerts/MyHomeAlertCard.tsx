import { replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events } from '@/_typings/events';
import { SavedSearch } from '@/_typings/saved-search';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  child: ReactElement;
  data: SavedSearch;
};

export default function MyHomeAlertCard({ child, data }: Props) {
  const propertyTypes = // @ts-ignore
    Array.isArray(data.dwelling_types.data) && data.dwelling_types.data?.length > 0
      ? // @ts-ignore
        data.dwelling_types.data.map(item => item.attributes.name).join(', ')
      : null;
  const replace = {
    Title: `${data?.city} ${propertyTypes ? `, ${propertyTypes}` : ''}`,
    city: 'WRONG CITY FROM API CALL',
    'min-price': data.minprice ?? 'Not Selected',
    'max-price': data.maxprice ?? 'Not Selected',
    area: ',NO FIELD',
    beds: data.beds,
    baths: data.baths,
    'min-sqft': data?.minsqft ?? 'N/A',
    'max-sqft': data?.maxsqft ?? 'N/A',
    'listed-since': data.add_date ?? 'Not Selected',
    'prop-newer-than': data.build_year ?? 'Not Selected',
    keywords: data.tags ?? 'Not Provided',

    proptype: propertyTypes ?? 'Not Selected',
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
