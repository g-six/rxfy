import { removeKeys, replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events } from '@/_typings/events';
import { SavedSearch, SavedSearchInput } from '@/_typings/saved-search';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, useState } from 'react';
import FiltersItem from '../ComparePage/FiltersItem';
import { DwellingType } from '@/_typings/property';
import { format } from 'date-fns';
import { updateSearch } from '@/_utilities/api-calls/call-saved-search';
import { AgentData } from '@/_typings/agent';
import { ValueInterface } from '@/_typings/ui-types';

type Props = {
  child: ReactElement;
  data: SavedSearch;
  agent_data: AgentData;
};

export default function MyHomeAlertCard({ child, data, agent_data }: Props) {
  const [wait, setWait] = useState(false);
  let dwelling_types: string[] = data.dwelling_types || [];
  const replace = {
    area: data.area || '',
    city: data.city || '',
    Title: `${data?.city} ${dwelling_types.length > 0 ? dwelling_types[0] : ''}`,
    'min-price': data.minprice ? getShortPrice(data.minprice, '') : 'Not Selected',
    'max-price': data.maxprice ? getShortPrice(data.maxprice, '') : 'Not Selected',
    beds: data.beds || 0,
    baths: data.baths || 1,
    'min-sqft': data?.minsqft ?? 'N/A',
    'max-sqft': data?.maxsqft ?? 'N/A',
    'listed-since': data.add_date ? format(new Date(data.add_date * 1000), 'd/M/y') : 'Not Selected',
    'prop-newer-than': data.year_built ?? 'Not Selected',
    keywords: data.tags ?? 'Not Provided',
    proptype: dwelling_types.length ? dwelling_types.join(', ') : 'Not Selected',
  };
  const handleEditClick = () => {
    fireCustomEvent(
      {
        show: true,
        message: 'Edit',
        alertData: { ...data, dwelling_types },
      },
      Events.MyHomeAlertsModal,
    );
  };
  const handleDeleteClick = (id: number) => {
    return () => {
      fireCustomEvent(
        {
          key: id,
          show: true,
          message: 'delete',
        },
        Events.MyHomeAlertsModal,
      );
    };
  };

  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['marketing-consent-checkbox']),
      transformChild: child => (
        <div className={`${wait ? 'pointer-events-none' : ''}`}>
          <FiltersItem
            item={{ title: 'Alert me when new homes go live' }}
            template={child}
            isPicked={data.is_active}
            handleCheckList={async () => {
              setWait(true);
              await updateSearch(data.id, agent_data, {
                search_params: removeKeys({ ...data, dwelling_types, is_active: !data.is_active } as SavedSearchInput, ['id']),
              });
              setWait(false);
            }}
          />
        </div>
      ),
    },
    {
      searchFn: searchByClasses(['ha-delete-button']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { onClick: handleDeleteClick(data.id) });
      },
    },
    {
      searchFn: searchByPartOfClass(['button-secondary']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { onClick: handleEditClick });
      },
    },
  ];
  return <>{transformMatchingElements(replaceAllTextWithBraces(child, replace), matches)}</>;
}
