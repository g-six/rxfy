import { removeKeys, replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events } from '@/_typings/events';
import { SavedSearch, SavedSearchInput } from '@/_typings/saved-search';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { searchByClasses, searchByPartOfClass, searchByProp } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, useState } from 'react';
import FiltersItem from '../ComparePage/FiltersItem';
import { DwellingType } from '@/_typings/property';
import { format } from 'date-fns';
import { updateSearch } from '@/_utilities/api-calls/call-saved-search';
import { AgentData } from '@/_typings/agent';
import { ValueInterface } from '@/_typings/ui-types';
import { formatValues } from '@/_utilities/data-helpers/property-page';

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
    Title: `${data?.city || data?.area || ''} ${dwelling_types.length > 0 ? dwelling_types[0] : ''}`,
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
    {
      searchFn: searchByProp('data-field', 'alert_name'),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {}, data.dwelling_types?.length ? data.dwelling_types[0] : 'Property Search');
      },
    },
    {
      searchFn: searchByProp('data-field', 'listed_since'),
      transformChild: (child: ReactElement) => {
        return cloneElement(
          child,
          {},
          data.add_date ? new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(new Date(data.add_date * 1000)) : 'No Preference',
        );
      },
    },
    {
      searchFn: searchByProp('data-group', 'location'),
      transformChild: (child: ReactElement) => {
        if (!data.city && !data.area) return <></>;
        if (!data.city || !data.area) return cloneElement(child, {}, [child.props.children[0], data.city || data.area]);
        return child;
      },
    },
    {
      searchFn: searchByProp('data-group', 'price'),
      transformChild: (child: ReactElement) => {
        if (!data.minprice && !data.maxprice) return <></>;
        if (!data.minprice || !data.maxprice) return cloneElement(child, {}, [child.props.children[0], data.minprice || data.maxprice]);
        return child;
      },
    },
    {
      searchFn: searchByProp('data-group', 'bed_bath'),
      transformChild: (child: ReactElement) => {
        if (!data.beds && !data.baths) return <></>;
        else if (!data.baths) return cloneElement(child, {}, [child.props.children[0], `${data.beds} beds`]);
        else if (!data.beds) return cloneElement(child, {}, [child.props.children[0], `${data.baths} baths`]);
        return child;
      },
    },
    {
      searchFn: searchByProp('data-group', 'size'),
      transformChild: (child: ReactElement) => {
        if (!data.minsqft && !data.maxsqft) return <></>;
        else if (!data.minsqft)
          return cloneElement(child, {}, [
            child.props.children[0],
            `At least ${formatValues(
              {
                floor_area: data.maxsqft,
              },
              'floor_area',
            )} sqft`,
          ]);
        else if (!data.maxsqft)
          return cloneElement(child, {}, [
            child.props.children[0],
            `max ${formatValues(
              {
                floor_area: data.minsqft,
              },
              'floor_area',
            )} sqft`,
          ]);
        return child;
      },
    },
    {
      searchFn: searchByProp('data-group', 'year_built'),
      transformChild: (child: ReactElement) => {
        if (!data.year_built) return <></>;
        return child;
      },
    },
    {
      searchFn: searchByProp('data-group', 'tags'),
      transformChild: (child: ReactElement) => {
        if (!data.tags) return <></>;
        return child;
      },
    },
  ];
  Object.keys(data).forEach(field => {
    matches.push({
      searchFn: searchByProp('data-field', field),
      transformChild: (child: ReactElement) => {
        const value = formatValues(data, field);
        if (!value) return <></>;
        return cloneElement(child, {}, value);
      },
    });
  });

  return <>{transformMatchingElements(child, matches)}</>;
}
