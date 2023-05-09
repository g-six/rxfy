import { ReactElement } from 'react';

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
}
