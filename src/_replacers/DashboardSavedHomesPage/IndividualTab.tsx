'use client';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
import { AgentData } from '@/_typings/agent';
import { captureMatchingElements, replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import RxPropertyTopStats from '@/components/RxProperty/RxPropertyTopStats';
import { MLSProperty } from '@/_typings/property';

import { combineAndFormatValues, formatValues, general_stats } from '@/_utilities/data-helpers/property-page';
import { getMLSProperty } from '@/_utilities/api-calls/call-properties';
import RxStreetView from '@/components/RxStreetView';
import StatBlock from './StatBlock';
import { prepareStats } from '@/_helpers/functions';
import { property } from 'cypress/types/lodash';
type Props = {
  child: ReactElement;
  agent_data: AgentData;
};

export default function IndividualTab({ child, agent_data }: Props) {
  const { data } = useEvent(Events.SavedItemsIndivTab);
  const { mls_id } = data || {};
  const [currentProperty, setCurrentProperty] = useState<MLSProperty>();

  useEffect(() => {
    if (mls_id) {
      getMLSProperty(mls_id).then((res: MLSProperty) => {
        setCurrentProperty(res);
      });
    }
  }, [mls_id]);

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['section---top-images']),
      transformChild: (child: ReactElement) => {
        return child;
      },
    },
    {
      //top stats block
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_STATS]),
      transformChild: (child: ReactElement) => {
        return currentProperty ? (
          <RxPropertyTopStats
            className={child.props.className}
            agent={agent_data}
            property={{ ...currentProperty, Address: currentProperty.address as string }}
          >
            {cloneElement(child.props.children)}
          </RxPropertyTopStats>
        ) : (
          cloneElement(child)
        );
      },
    },
    {
      searchFn: searchByClasses(['section---beds-baths']),
      transformChild: (child: ReactElement) => {
        const cp = currentProperty;

        return currentProperty
          ? (replaceAllTextWithBraces(child, {
              Beds: cp?.L_BedroomTotal,
              Baths: cp?.baths,
              'Year Built': cp?.L_YearBuilt,
              Sqft: cp?.L_LotSize_SqMtrs,
              Area: cp?.Area,
              Description: cp?.L_InternetRemakrs || cp?.L_PublicRemakrs || '',
              'Listing By': cp?.L_ManagmentCompany,
            }) as ReactElement)
          : child;
      },
    },
    {
      //street-view block
      searchFn: searchByClasses(['street-view-div']),
      transformChild: (child: ReactElement) =>
        currentProperty ? <RxStreetView key={'street-view'} className={child.props.className} property={currentProperty} /> : child,
    },
    {
      searchFn: searchByClasses(['stats-level-2']),
      transformChild: (child: ReactElement) => {
        const cp: MLSProperty | { [key: string]: string } = currentProperty || {};
        return currentProperty
          ? (replaceAllTextWithBraces(child, {
              'Building Type': cp?.PropertyType,
              'MLS Number': cp?.MLS_ID,
              'Lot Size': formatValues(cp, 'L_LotSize_SqMtrs'),
              'Land Title': cp?.LandTitle,
              'Price Per Sqft': formatValues(cp, 'PricePerSQFT'),
              'Property Tax': combineAndFormatValues({
                L_GrossTaxes: cp.L_GrossTaxes,
                ForTaxYear: cp.ForTaxYear,
              }),
            }) as ReactElement)
          : child;
      },
    },

    {
      searchFn: searchByClasses(['propinfo-title']),
      transformChild: (child: ReactElement) => {
        const statsPrep = currentProperty ? prepareStats(general_stats, currentProperty) : [];

        return currentProperty ? (
          <StatBlock child={child} stats={statsPrep} config={{ label: 'Property Info Stat Name', value: 'Property Info Stat Result' }} />
        ) : (
          child
        );
      },
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
