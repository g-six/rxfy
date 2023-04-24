import { ReactElement } from 'react';

import { AgentData } from '@/_typings/agent';
import { MLSProperty } from '@/_typings/property';

export interface ReplacerPageProps {
  nodeProps: any;
  nodeClassName: string;
  nodes?: ReactElement[];
  children?: ReactElement[];
  agent: AgentData;
  property?: MLSProperty;
  config?: {
    authorization: string;
    url: string;
  };
}

// for DEV 15mins in millisec, for PROD 48 hours in millisec;
export const HOME_ALERTS_DISMISS_TIMEOUT = process.env.NODE_ENV === 'development' ? 900000 : 86400000;
export interface ReplacerHomeAlerts {
  child?: ReactElement;
  agent: AgentData;
  showIcon?: boolean;
  isLoggedIn?: boolean;
}

export interface DataUrl {
  base64: string;
  content: string;
  format: string;
  dataType: string;
}

export enum disclaimer {
  REBGV = 'The above information is provided by members of the BC Northern Real Estate Board, Chilliwack & District Real Estate Board, Fraser Valley Real Estate Board or Real Estate Board of Greater Vancouver Board(‘the Board”) and is from sources believed reliable but should not be relied upon without verification. The Boards assume no responsibillity for its accuracy. PREC* indicates ‘Personal Real Estate Corporation’.',
  VIVA = '',
}
