import { EventsData } from '@/hooks/useEvent';
import { ReactElement } from 'react';

import { ValueInterface, RoomDimension } from './ui-types';
import { AgentData } from '@/_typings/agent';
import { PrivateListingData } from './events';

export type PageTabs = 'my-listings' | 'private-listing';
export enum createListingTabs {
  AI = 'tab-ai',
  ADDRESS = 'tab-address',
  SUMMARY = 'tab-summary',
  SIZE = 'tab-size',
  ROOMS = 'tab-rooms',
  STRATA = 'tab-strata',
  MORE = 'tab-more',
  PREVIEW = 'tab-preview',
}

export enum mapsViewsTabs {
  NEIGHBORHOOD = 'tab-neighborhood',
  STREET = 'tab-street',
}
export interface TabContentProps {
  template: ReactElement;
  nextStepClick: (callback?: () => void, dataToAdd?: PrivateListingData) => void;
  saveAndExit: (data: any) => void;
  attributes: {
    [key: string]: ValueInterface[];
  };
  data: any | undefined;
  fireEvent: (data: PrivateListingData) => void;
  agent: AgentData;
}
export interface RoomsGroupProps {
  heading?: string;
  rooms: number;
  headingTemplate: ReactElement;
  inputTemplate: ReactElement;
  rowClassName?: string;
  checkboxTemplate?: ReactElement;
  data?: RoomDimension[];
  onChange: (index: number, param: string, val: string | boolean) => void;
}
export const regularRow = [
  {
    label: 'Room Name',
    inputProps: {
      placeholder: 'Room Name',
      name: 'name',
    },
  },
  {
    label: 'Level',
    inputProps: {
      placeholder: 'Level',
      name: 'level',
    },
  },
  {
    label: 'Width',
    inputProps: {
      placeholder: 'Width',
      name: 'width',
    },
  },
  {
    label: 'Length',
    inputProps: {
      placeholder: 'Length',
      name: 'length',
    },
  },
];

export type LatLng = {
  lat: number;
  lon: number;
};
