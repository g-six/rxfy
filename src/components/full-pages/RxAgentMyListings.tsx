import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import NewOrEditListingTab from '@/_replacers/AgentMyListingsPage/NewOrEditListingTab';
import { AgentData } from '@/_typings/agent';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement } from 'react';

type Props = {
  nodeProps: {
    [x: string]: string;
  };
  agent_data: AgentData;
  nodes: ReactElement[];
};

export default function RxAgentMyListings({ nodeProps, agent_data, nodes }: Props) {
  const matches: tMatch[] = [{ searchFn: searchByClasses(['tab-pane-private-listings']), transformChild: child => <NewOrEditListingTab child={child} /> }];
  return <div className={nodeProps?.className}>{transformMatchingElements(nodes, matches)}</div>;
}
