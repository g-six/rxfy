import { AgentData } from '@/_typings/agent';
import { UserData } from '@/_typings/user';
import { ReactElement } from 'react';
export interface ReplacerPageProps {
  nodeProps: any;
  nodeClassName: string;
  nodes?: ReactElement[];
  children?: ReactElement[];
  agent: AgentData;
}

// for DEV 15mins in millisec, for PROD 48 hours in millisec;
export const HOME_ALERTS_DISMISS_TIMEOUT = process.env.NODE_ENV === 'development' ? 900000 : 86400000;
export interface ReplacerHomeAlerts {
  child?: ReactElement;
  agent: AgentData;
  // user: UserData;
  onClose: () => void;
  showIcon?: boolean;
  isLoggedIn?: boolean;
}
