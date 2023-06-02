import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import React, { cloneElement, useState } from 'react';
import RoomsGroup from './RoomsGroup';
import BathsGroup from './BathroomsGroup';

export default function TabRooms({ template, nextStepClick }: TabContentProps) {
  const bedrooms = 2;
  const full_baths = 1;
  const half_baths = 1;
  const kitchens = 1;
  const additional_rooms = 2;
  const garage = 1;
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
        return cloneElement(
          child,
          {},

          [
            bedrooms && <RoomsGroup heading='Bedrooms' key={0} rooms={bedrooms} {...prepdTemplates} />,
            full_baths && <BathsGroup heading='Full Baths' key={1} rooms={full_baths} {...prepdTemplates} />,
            half_baths && <BathsGroup heading='Half Baths' key={2} rooms={half_baths} {...prepdTemplates} />,
            kitchens && <RoomsGroup heading='Kitchens' key={3} rooms={kitchens} {...prepdTemplates} />,
            additional_rooms && <RoomsGroup heading='Additional Rooms' key={4} rooms={additional_rooms} {...prepdTemplates} />,
            garage && <RoomsGroup heading='Garage' key={5} rooms={garage} {...prepdTemplates} />,
          ],
        );
      },
    },
    { searchFn: searchByPartOfClass(['f-button-neutral', 'w-button']), transformChild: child => cloneElement(child, { onClick: nextStepClick }) },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
