import React, { ReactElement } from 'react';

import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { prepareStats } from '@/_helpers/functions';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { construction_stats, dimension_stats, financial_stats, general_stats } from '@/_utilities/data-helpers/property-page';
import RxStatBlock from '@/components/RxProperty/RxStatBlock';
import RxPropertyAgent from '@/components/RxProperty/RxPropertyAgent';

type Props = {
  property: PropertyDataModel | undefined | null;
  agent: AgentData;
  child: ReactElement;
};

export default function RxPropertyStats(props: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['propinfo-title']),
      transformChild: (child: ReactElement) => {
        return (
          <RxStatBlock
            child={child}
            stats={prepareStats(general_stats, props.property)}
            config={{ label: 'Property Info Stat Name', value: 'Property Info Stat Result' }}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['financial-title']),
      transformChild: (child: ReactElement) => {
        return (
          <RxStatBlock
            child={child}
            stats={prepareStats(financial_stats, props.property)}
            config={{ label: 'Financial Stat Name', value: 'Financial Stat Result' }}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['dimensions-title']),
      transformChild: (child: ReactElement) => {
        return (
          <RxStatBlock
            child={child}
            stats={prepareStats(dimension_stats, props.property)}
            config={{ label: 'Dimensions Stat Name', value: 'Dimensions Stat Result' }}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['construction-title']),
      transformChild: (child: ReactElement) => {
        return (
          <RxStatBlock
            child={child}
            stats={prepareStats(construction_stats, props.property)}
            config={{ label: 'Construction Stat Name', value: 'Construction Stat Result' }}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['little-profile-card']),
      transformChild: (child: ReactElement) => {
        return <RxPropertyAgent child={child} agent={props.agent} />;
      },
    },
  ];
  return <>{transformMatchingElements(props.child, matches)}</>;
}
