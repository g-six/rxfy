import { ReactElement } from 'react';
import { ValueInterface } from './ui-types';

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
}
export const regularRow = [
  {
    label: 'Room Name',
    inputProps: {
      placeholder: 'Room Name',
    },
  },
  {
    label: 'Level',
    inputProps: {
      placeholder: 'Level',
    },
  },
  {
    label: 'Dimensions 1',
    inputProps: {
      placeholder: 'Dimensions 1',
    },
  },
  {
    label: 'Dimensions 2',
    inputProps: {
      placeholder: 'Dimensions 2',
    },
  },
];
