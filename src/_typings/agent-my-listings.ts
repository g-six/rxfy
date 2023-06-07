import { ReactElement } from 'react';
import { ValueInterface, RoomDimension } from './ui-types';

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
export interface TabContentProps {
  template: ReactElement;
  nextStepClick: () => void;
  attributes: {
    [key: string]: ValueInterface[];
  };
  initialState: any | undefined;
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
    label: 'Dimensions 1',
    inputProps: {
      placeholder: 'Dimensions 1',
      name: 'dimension1',
    },
  },
  {
    label: 'Dimensions 2',
    inputProps: {
      placeholder: 'Dimensions 2',
      name: 'dimension2',
    },
  },
];
