/* eslint-disable react-hooks/exhaustive-deps */
import React, { cloneElement, useEffect, useState } from 'react';
import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { RoomDimension } from '@/_typings/ui-types';

import RoomsGroup from './RoomsGroup';
import BathsGroup from './BathroomsGroup';

import { PrivateListingData } from '@/hooks/useFormEvent';

export default function TabRooms({ template, nextStepClick, data }: TabContentProps) {
  const [templates] = useState(
    captureMatchingElements(template, [
      { elementName: 'heading', searchFn: searchByPartOfClass(['f-sub-heading-small']) },
      { elementName: 'input', searchFn: searchByPartOfClass(['f-field-wrapper']) },
      { elementName: 'checkbox', searchFn: searchByPartOfClass(['checkbox-wrap']) },
      { elementName: 'inputsRow', searchFn: searchByPartOfClass(['rooms-inputs']) },
    ]),
  );

  const [room_details, setRoomDetails] = useState<{
    [key: string]: RoomDimension[];
  }>();
  const [bathroom_details, setBathDetails] = useState<{
    [key: string]: RoomDimension[];
  }>();

  const prepdTemplates = {
    headingTemplate: templates.heading,
    inputTemplate: templates.input,
    rowClassName: templates.inputsRow.props.className ?? '',
    checkboxTemplate: templates.checkbox,
  };

  const rebuild = () => {
    const sub = ['half_baths', 'baths', 'rooms', 'others', 'garage', 'kitchens'];
    let new_room_copy = {
      ...room_details,
    };
    let new_bath_copy = {
      ...bathroom_details,
    };
    ['half_baths', 'full_baths', 'beds', 'total_additional_rooms', 'total_garage', 'total_kitchens'].forEach((r: string, idx) => {
      let obj: RoomDimension[] = [];
      if (data?.[r]) {
        if (['half_baths', 'full_baths'].includes(r)) {
          obj = data?.bathroom_details?.[sub[idx]] || bathroom_details?.[sub[idx]] || [];
        } else {
          obj = data?.room_details?.[sub[idx]] || room_details?.[sub[idx]] || [];
        }
      } else {
        obj = [];
      }

      if (obj.length < data[r]) {
        obj = obj.concat(
          Array.from({ length: data[r] - obj.length }, (v, i) => ({
            name: '',
            level: '',
            width: '',
            length: '',
            ensuite: false,
          })),
        );
      } else if (obj.length > data[r]) {
        obj = obj.slice(0, data[r]);
      }

      if (['half_baths', 'full_baths'].includes(r)) {
        new_bath_copy = {
          ...new_bath_copy,
          [sub[idx]]: obj,
        };
      } else {
        new_room_copy = {
          ...new_room_copy,
          [sub[idx]]: obj,
        };
      }
    });
    setBathDetails(new_bath_copy);
    setRoomDetails(new_room_copy);
  };

  useEffect(() => {
    rebuild();
  }, [data]);

  useEffect(() => {
    rebuild();
  }, []);

  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['f-account-form-block']),
      transformChild: child => {
        return cloneElement(child, {}, [
          room_details?.rooms && (
            <RoomsGroup
              heading='Bedrooms'
              key={0}
              rooms={data.beds}
              {...prepdTemplates}
              data={room_details.rooms}
              onChange={(index, param, val) => {
                if (room_details?.['rooms']) {
                  const obj = room_details['rooms'] as unknown as {
                    [key: string]: string | boolean;
                  }[];
                  obj[index][param] = val;
                  setRoomDetails({
                    ...room_details,
                    rooms: obj,
                  });
                }
              }}
            />
          ),
          bathroom_details?.baths && (
            <BathsGroup
              heading='Full Baths'
              key={1}
              rooms={data.full_baths}
              {...prepdTemplates}
              data={bathroom_details?.baths || []}
              onChange={(index, param, val) => {
                if (bathroom_details?.['baths']) {
                  const obj = bathroom_details['baths'] as unknown as {
                    [key: string]: string | boolean;
                  }[];
                  obj[index][param] = val;
                  setBathDetails({
                    ...bathroom_details,
                    baths: obj,
                  });
                }
              }}
            />
          ),
          bathroom_details?.half_baths && (
            <BathsGroup
              heading='Half Baths'
              key={2}
              rooms={data.half_baths}
              {...prepdTemplates}
              data={bathroom_details?.half_baths || []}
              onChange={(index, param, val) => {
                if (bathroom_details?.['half_baths']) {
                  const obj = bathroom_details['half_baths'] as unknown as {
                    [key: string]: string | boolean;
                  }[];
                  obj[index][param] = val;
                  setBathDetails({
                    ...bathroom_details,
                    half_baths: obj,
                  });
                }
              }}
            />
          ),
          room_details?.kitchens && (
            <RoomsGroup
              heading='Kitchens'
              key={3}
              rooms={data.total_kitchens}
              {...prepdTemplates}
              data={room_details?.kitchens || []}
              onChange={(index, param, val) => {
                if (room_details?.['kitchens']) {
                  const obj = room_details['kitchens'] as unknown as {
                    [key: string]: string | boolean;
                  }[];
                  obj[index][param] = val;
                  setRoomDetails({
                    ...room_details,
                    kitchens: obj,
                  });
                }
              }}
            />
          ),
          room_details?.others && (
            <RoomsGroup
              heading='Additional Rooms'
              key={4}
              rooms={data.total_additional_rooms}
              {...prepdTemplates}
              data={room_details?.others}
              onChange={(index, param, val) => {
                if (room_details?.['others']) {
                  const obj = room_details['others'] as unknown as {
                    [key: string]: string | boolean;
                  }[];
                  obj[index][param] = val;
                  setRoomDetails({
                    ...room_details,
                    others: obj,
                  });
                }
              }}
            />
          ),
          room_details?.garage && (
            <RoomsGroup
              heading='Garage'
              key={5}
              rooms={data.total_garage}
              {...prepdTemplates}
              data={room_details?.garage}
              onChange={(index, param, val) => {
                if (room_details?.['garage']) {
                  const obj = room_details['garage'] as unknown as {
                    [key: string]: string | boolean;
                  }[];
                  obj[index][param] = val;
                  setRoomDetails({
                    ...room_details,
                    garage: obj,
                  });
                }
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
            nextStepClick(undefined, {
              room_details,
              bathroom_details,
            } as unknown as PrivateListingData);
          },
        }),
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
