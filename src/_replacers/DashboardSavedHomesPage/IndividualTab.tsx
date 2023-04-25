'use client';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
import { AgentData } from '@/_typings/agent';
import { captureMatchingElements, replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import RxPropertyTopStats from '@/components/RxProperty/RxPropertyTopStats';
import { MLSProperty } from '@/_typings/property';
import Image from 'next/image';
import {
  combineAndFormatValues,
  construction_stats,
  dimension_stats,
  financial_stats,
  formatValues,
  general_stats,
} from '@/_utilities/data-helpers/property-page';
import { getMLSProperty } from '@/_utilities/api-calls/call-properties';
import RxStreetView from '@/components/RxStreetView';
import RxStatBlock from './RxStatBlock';
import { mapFeatures, prepareStats } from '@/_helpers/functions';
import RxFeatures from './RxFeatures';

import RxBuildOrSoldHistory from './RxBuildOrSoldHistory';
import RxPropertyCarousel from '@/components/RxProperty/RxPropertyCarousel';
import PhotosGrid from './PhotosGrid';

type Props = {
  child: ReactElement;
  agent_data: AgentData;
};

export default function IndividualTab({ child, agent_data }: Props) {
  const { data } = useEvent(Events.SavedItemsIndivTab);
  const { mls_id } = data || {};
  const [currentProperty, setCurrentProperty] = useState<MLSProperty | null>(null);

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
        return <PhotosGrid child={child} photos={(currentProperty?.photos as string[]) || []} />;
      },
    },
    {
      //top stats block
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_STATS]),
      transformChild: (child: ReactElement) => {
        return currentProperty ? (
          <RxPropertyTopStats
            nodeClassName={child.props.className}
            nodeProps={child.props}
            agent={agent_data}
            property={{ ...currentProperty, Address: currentProperty.address as string }}
          >
            {/* @ts-ignore */}
            {cloneElement(child.props.children)}
          </RxPropertyTopStats>
        ) : (
          child
        );
      },
    },
    {
      searchFn: searchByClasses(['section---beds-baths']),
      transformChild: (child: ReactElement) => {
        const cp = currentProperty;
        console.log(cp);
        return replaceAllTextWithBraces(child, {
          Beds: cp?.L_BedroomTotal,
          Baths: cp?.baths,
          'Year Built': cp?.L_YearBuilt,
          Sqft: cp?.L_LotSize_SqMtrs,
          Area: cp?.Area,
          Description: cp?.description || cp?.L_InternetRemakrs || cp?.L_PublicRemakrs,
          'Listing By': cp?.L_ManagmentCompany,
        }) as ReactElement;
      },
    },
    {
      //street-view block
      searchFn: searchByClasses(['street-view-div']),
      transformChild: (child: ReactElement) => <RxStreetView key={'street-view'} className={child.props.className} property={currentProperty} />,
    },
    {
      searchFn: searchByClasses(['stats-level-2']),
      transformChild: (child: ReactElement) => {
        const cp: MLSProperty | { [key: string]: string } = currentProperty || {};
        return replaceAllTextWithBraces(child, {
          'Building Type': cp?.PropertyType,
          'MLS Number': cp?.MLS_ID,
          'Lot Size': formatValues(cp, 'L_LotSize_SqMtrs'),
          'Land Title': cp?.LandTitle,
          'Price Per Sqft': formatValues(cp, 'PricePerSQFT'),
          'Property Tax': combineAndFormatValues({
            L_GrossTaxes: cp.L_GrossTaxes,
            ForTaxYear: cp.ForTaxYear,
          }),
        }) as ReactElement;
      },
    },

    {
      searchFn: searchByClasses(['propinfo-title']),
      transformChild: (child: ReactElement) => {
        return (
          <RxStatBlock
            child={child}
            stats={prepareStats(general_stats, currentProperty)}
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
            stats={prepareStats(financial_stats, currentProperty)}
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
            stats={prepareStats(dimension_stats, currentProperty)}
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
            stats={prepareStats(construction_stats, currentProperty)}
            config={{ label: 'Construction Stat Name', value: 'Construction Stat Result' }}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['property-image-collection2']),
      transformChild: (child: ReactElement) => {
        const phts = currentProperty && Array.isArray(currentProperty.photos) ? currentProperty.photos : [];
        const sliced = phts?.slice(0, 4);

        return cloneElement(
          child,
          { ...child.props },
          sliced.map((src, i) => (
            <div key={`gallery #${i}`} className='relative w-full h-full overflow-hidden rounded-lg'>
              <Image src={src as string} alt={`gallery #${i}`} fill />
            </div>
          )),
        );
      },
    },
    {
      searchFn: searchByClasses(['div-features-block']),
      transformChild: (child: ReactElement) => {
        return <RxFeatures child={child} features={mapFeatures(currentProperty)} />;
      },
    },
    // {
    //   searchFn: searchByClasses(['building-and-sold-column']),
    //   transformChild: (child: ReactElement) => {
    //     const isBuilding = !parseInt(child.key as string);

    //     return (
    //       <RxBuildOrSoldHistory
    //         type={isBuilding ? 'building' : 'sold-history'}
    //         // config={parseInt(child.props.key)?{}}
    //         child={child}
    //         data={isBuilding ? (currentProperty?.neighbours as MLSProperty[]) : (currentProperty?.sold_history as MLSProperty[])}
    //       />
    //     );
    //   },
    // },
  ];

  return <>{currentProperty ? transformMatchingElements(child, matches) : child}</>;
}
