import { AgentData } from '@/_typings/agent';
import { MouseEvent, ReactElement } from 'react';

export interface TabProps {
  active: string;
  children: ReactElement;
  agent: AgentData & { phone_number: string; brokerage?: { [k: string]: string } };
  onTabClick(evt: MouseEvent<HTMLDivElement>): void;
  onContentUpdate(updates: AgentData & { phone_number: string; brokerage?: { [k: string]: string } }): void;
}
