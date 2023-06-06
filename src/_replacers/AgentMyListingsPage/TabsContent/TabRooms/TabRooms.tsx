import React, { cloneElement, useState } from 'react';

import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { RoomDimension } from '@/_typings/ui-types';

import RoomsGroup from './RoomsGroup';
import BathsGroup from './BathroomsGroup';

import useFormEvent, { Events, PrivateListingData, getValueByKey } from '@/hooks/useFormEvent';

function getInitialData(key: string, count: number, data: any) {
  return data && data[key]
    ? data[key]
    : Array.from({ length: count }, (_, index) => index).reduce((a: RoomDimension[]) => {
        a.push({});
        return a;
      }, []);
}

export default function TabRooms({ template, nextStepClick, initialState }: TabContentProps) {
  const { data, fireEvent } = useFormEvent<PrivateListingData>(Events.PrivateListingForm, initialState);

  const setDimension = React.useCallback(
    (type: string, index: number, param: string, val: string | boolean) => {
      let newData = getValueByKey(type, data);
      if (newData && newData[index]) {
        newData[index] = Object.assign({}, newData[index], { [param]: val });
      } else {
        newData = [{ [param]: val }];
      }
      fireEvent({ [type]: newData });
    },
    [data, fireEvent],
  );

  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'heading', searchFn: searchByPartOfClass(['f-sub-heading-small']) },
      { elementName: 'input', searchFn: searchByPartOfClass(['f-field-wrapper']) },
      { elementName: 'checkbox', searchFn: searchByPartOfClass(['checkbox-wrap']) },
      { elementName: 'inputsRow', searchFn: searchByPartOfClass(['rooms-inputs']) },
    ]),
  );

  const prepdTemplates = {
    headingTemplate: templates.heading,
    inputTemplate: templates.input,
    rowClassName: templates.inputsRow.props.className ?? '',
    checkboxTemplate: templates.checkbox,
  };

  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['f-account-form-block']),
      transformChild: child => {
        if (
          !data?.beds_dimensions ||
          !data?.baths_full_dimensions ||
          !data?.baths_half_dimensions ||
          !data?.kitchen_dimensions ||
          !data?.additional_dimensions ||
          !data?.garage_dimensions
        ) {
          const beds_dim = getInitialData('beds_dimensions', data?.beds ?? 0, data);
          const bath_full_dim = getInitialData('baths_full_dimensions', data?.baths_full ?? 0, data);
          const bath_half_dim = getInitialData('baths_half_dimensions', data?.baths_half ?? 0, data);
          const kitchens_dim = getInitialData('kitchen_dimensions', data?.kitchens ?? 0, data);
          const additional_dim = getInitialData('additional_dimensions', data?.additional_rooms ?? 0, data);
          const garage_dim = getInitialData('garage_dimensions', data?.garage ?? 0, data);
          fireEvent({
            beds_dimensions: beds_dim,
            baths_full_dimensions: bath_full_dim,
            baths_half_dimensions: bath_half_dim,
            kitchen_dimensions: kitchens_dim,
            additional_dimensions: additional_dim,
            garage_dimensions: garage_dim,
          });
        }
        return cloneElement(child, {}, [
          data?.beds && (
            <RoomsGroup
              heading='Bedrooms'
              key={0}
              rooms={data.beds}
              {...prepdTemplates}
              data={data?.beds_dimensions}
              onChange={(index, param, val) => setDimension('garage_dimensions', index, param, val)}
            />
          ),
          data?.baths_full && (
            <BathsGroup
              heading='Full Baths'
              key={1}
              rooms={data.baths_full}
              {...prepdTemplates}
              data={data?.baths_full_dimensions}
              onChange={(index, param, val) => setDimension('baths_full_dimensions', index, param, val)}
            />
          ),
          data?.baths_half && (
            <BathsGroup
              heading='Half Baths'
              key={2}
              rooms={data.baths_half}
              {...prepdTemplates}
              data={data?.baths_half_dimensions}
              onChange={(index, param, val) => setDimension('baths_half_dimensions', index, param, val)}
            />
          ),
          data?.kitchens && (
            <RoomsGroup
              heading='Kitchens'
              key={3}
              rooms={data.kitchens}
              {...prepdTemplates}
              data={data?.kitchen_dimensions}
              onChange={(index, param, val) => setDimension('garage_dimensions', index, param, val)}
            />
          ),
          data?.additional_rooms && (
            <RoomsGroup
              heading='Additional Rooms'
              key={4}
              rooms={data.additional_rooms}
              {...prepdTemplates}
              data={data?.additional_dimensions}
              onChange={(index, param, val) => setDimension('garage_dimensions', index, param, val)}
            />
          ),
          data?.garage && (
            <RoomsGroup
              heading='Garage'
              key={5}
              rooms={data.garage}
              {...prepdTemplates}
              data={data?.garage_dimensions}
              onChange={(index, param, val) => setDimension('garage_dimensions', index, param, val)}
            />
          ),
        ]);
      },
    },
    {
      searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']),
      transformChild: child => cloneElement(child, { onClick: nextStepClick }),
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
