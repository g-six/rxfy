import { AgentData } from '@/_typings/agent';
import { LovedPropertyDataModel } from '@/_typings/property';
import { classNames } from '@/_utilities/html-helper';
import { ReactElement } from 'react';

export function SavedHomesPropertyList({
  className = 'no-class',
  ...p
}: {
  children: ReactElement;
  className?: string;
  agent: AgentData;
  properties?: LovedPropertyDataModel[];
}) {
  console.log('p.properties', p.properties);
  return <aside className={classNames(className, 'rexified property-list.module')}>{p.children}</aside>;
}
