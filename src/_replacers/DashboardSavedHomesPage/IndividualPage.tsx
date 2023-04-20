'use client';
import React, { ReactElement, useEffect, useState } from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
import { getMLSProperty } from '@/_utilities/api-calls/call-properties';
import { AgentData } from '@/_typings/agent';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { matches } from 'cypress/types/lodash';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import RxPropertyTopStats from '@/components/RxProperty/RxPropertyTopStats';
import { MLSProperty } from '@/_typings/property';

type Props = {
  child: ReactElement;
  agent_data: AgentData;
};

export default function IndividualPage({ child, agent_data }: Props) {
  const [currentProperty, setCurrentProperty] = useState<MLSProperty | null>(null);
  const { data, fireEvent } = useEvent(Events.SavedItemsProperty);
  const { property } = data || {};
  useEffect(() => {
    if (property) {
      setCurrentProperty(property);
    }
  }, [property]);

  const matches = [
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_STATS]),
      transformChild: (child: ReactElement) => {
        return currentProperty ? (
          <RxPropertyTopStats
            className={child.props.className}
            agent={agent_data}
            property={{ ...currentProperty, Address: currentProperty.address as string }}
          >
            {child.props.children}
          </RxPropertyTopStats>
        ) : (
          child
        );
      },
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
