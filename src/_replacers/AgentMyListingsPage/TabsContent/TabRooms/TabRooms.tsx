import React, { cloneElement, useEffect, useState } from 'react';
import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { RoomDimension } from '@/_typings/ui-types';

import RoomsGroup from './RoomsGroup';
import BathsGroup from './BathroomsGroup';

import useFormEvent, { Events, PrivateListingData, getValueByKey } from '@/hooks/useFormEvent';
import { convertToDetails } from '@/_helpers/mls-mapper';

function getInitialData(key: string, count: number, data: any) {
  return data && data[key]
    ? [...data[key]]
    : Array.from({ length: count }, (_, index) => index).reduce((a: RoomDimension[]) => {
        a.push({});
        return a;
      }, []);
}

export default function TabRooms({ template, nextStepClick, data, fireEvent }: TabContentProps) {
  const setDimension = (type: string, index: number, param: string, val: string | boolean) => {
    let newData = getValueByKey(type, data);

    if (newData && newData[index]) {
      newData[index] = Object.assign({}, newData[index], { [param]: val });
    } else {
      newData = [{ [param]: val }];
    }

    fireEvent({ [type]: [...newData] });
  };

  useEffect(() => {
    const { beds_dimensions, baths_full_dimensions, baths_half_dimensions, kitchen_dimensions, additional_dimensions, garage_dimensions } = data || {};
    const fireEventParams = {
      ...(data?.beds && !beds_dimensions && { beds_dimensions: getInitialData('beds_dimensions', data.beds, data) }),
      ...(data?.full_baths && !baths_full_dimensions && { baths_full_dimensions: getInitialData('baths_full_dimensions', data.full_baths, data) }),
      ...(data?.half_baths && !baths_half_dimensions && { baths_half_dimensions: getInitialData('baths_half_dimensions', data.half_baths, data) }),
      ...(data?.total_kitchens && !kitchen_dimensions && { kitchen_dimensions: getInitialData('kitchen_dimensions', data.total_kitchens, data) }),
      ...(data?.total_additional_rooms &&
        !additional_dimensions && { additional_dimensions: getInitialData('additional_dimensions', data.total_additional_rooms, data) }),
      ...(data?.total_garage && !garage_dimensions && { garage_dimensions: getInitialData('garage_dimensions', data.total_garage, data) }),
    };
    Object.keys(fireEventParams)?.length > 0 &&
      fireEvent({
        ...fireEventParams,
      });
  }, []);
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
        return cloneElement(child, {}, [
          !!data?.beds && (
            <RoomsGroup
              heading='Bedrooms'
              key={0}
              rooms={data.beds}
              {...prepdTemplates}
              data={data?.beds_dimensions}
              onChange={(index, param, val) => {
                setDimension('beds_dimensions', index, param, val);
              }}
            />
          ),
          !!data?.full_baths && (
            <BathsGroup
              heading='Full Baths'
              key={1}
              rooms={data.full_baths}
              {...prepdTemplates}
              data={data?.baths_full_dimensions}
              onChange={(index, param, val) => {
                setDimension('baths_full_dimensions', index, param, val);
              }}
            />
          ),
          !!data?.half_baths && (
            <BathsGroup
              heading='Half Baths'
              key={2}
              rooms={data.half_baths}
              {...prepdTemplates}
              data={data?.baths_half_dimensions}
              onChange={(index, param, val) => {
                setDimension('baths_half_dimensions', index, param, val);
              }}
            />
          ),
          !!data?.total_kitchens && (
            <RoomsGroup
              heading='Kitchens'
              key={3}
              rooms={data.total_kitchens}
              {...prepdTemplates}
              data={data?.kitchen_dimensions}
              onChange={(index, param, val) => {
                setDimension('kitchen_dimensions', index, param, val);
              }}
            />
          ),
          !!data?.total_additional_rooms && (
            <RoomsGroup
              heading='Additional Rooms'
              key={4}
              rooms={data.total_additional_rooms}
              {...prepdTemplates}
              data={data?.additional_dimensions}
              onChange={(index, param, val) => {
                setDimension('additional_dimensions', index, param, val);
              }}
            />
          ),
          !!data?.total_garage && (
            <RoomsGroup
              heading='Garage'
              key={5}
              rooms={data.total_garage}
              {...prepdTemplates}
              data={data?.garage_dimensions}
              onChange={(index, param, val) => {
                setDimension('garage_dimensions', index, param, val);
              }}
            />
          ),
        ]);
      },
    },
    {
      searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            nextStepClick();
          },
        }),
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
