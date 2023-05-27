'use client';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import Image from 'next/image';

import useEvent, { Events } from '@/hooks/useEvent';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';

import { fireCustomEvent, mapFeatures, prepareStats } from '@/_helpers/functions';
import { replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { getMLSProperty } from '@/_utilities/api-calls/call-properties';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import {
  combineAndFormatValues,
  construction_stats,
  dimension_stats,
  financial_stats,
  formatValues,
  general_stats,
} from '@/_utilities/data-helpers/property-page';

import PhotosCarousel from '@/components/PhotosCarousel';
import RxPropertyTopStats from '@/components/RxProperty/RxPropertyTopStats';
import RxMapOfListing from '@/components/RxMapOfListing';
import RxStatBlock from '@/components/RxProperty/RxStatBlock';
import RxFeatures from '@/components/RxProperty/RxFeatures';
import PhotosGrid from '@/components/RxProperty/PhotosGrid';

type Props = {
  child: ReactElement;
  agent_data: AgentData;
};

export default function IndividualTab({ child, agent_data }: Props) {
  const { data } = useEvent(Events.SavedItemsIndivTab);
  const { mls_id } = data || {};
  const [currentProperty, setCurrentProperty] = useState<PropertyDataModel | null>(null);
  const showGallery = (key: number) => {
    fireCustomEvent({ show: true, photos: currentProperty?.photos ?? [], key }, Events.PropertyGalleryModal);
  };
  useEffect(() => {
    if (mls_id) {
      getMLSProperty(mls_id).then((res: PropertyDataModel) => {
        setCurrentProperty(res);
      });
    }
  }, [mls_id]);

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['section---top-images']),
      transformChild: (child: ReactElement) => {
        return <PhotosGrid showGallery={showGallery} child={child} photos={(currentProperty?.photos as string[]) || []} />;
      },
    },
    {
      //top stats block
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_STATS]),
      transformChild: (child: ReactElement) => {
        const el = [cloneElement(child.props.children) as ReactElement];
        return currentProperty ? (
          <RxPropertyTopStats nodeClassName={child.props.className} nodeProps={child.props} agent={agent_data} property={currentProperty}>
            {el}
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
        return replaceAllTextWithBraces(child, {
          Beds: cp?.beds,
          Baths: cp?.baths,
          'Year Built': cp?.year_built,
          Sqft: cp?.floor_area,
          Area: cp?.area,
          Description: cp?.description,
          'Listing By': cp?.listing_by,
        }) as ReactElement;
      },
    },
    {
      //street-view block
      searchFn: searchByClasses(['street-view-div']),
      transformChild: (child: ReactElement) => {
        return <RxMapOfListing key={'street-view'} child={child} property={currentProperty} mapType={'street'} />;
      },
    },
    {
      searchFn: searchByClasses(['stats-level-2']),
      transformChild: (child: ReactElement) => {
        const cp: PropertyDataModel | { [key: string]: string } = currentProperty || {};
        return replaceAllTextWithBraces(child, {
          'Building Type': cp?.property_type,
          'MLS Number': cp?.mls_id,
          'Lot Size': formatValues(cp, 'lot_sqm'),
          'Land Title': cp?.land_title,
          'Price Per Sqft': formatValues(cp, 'price_per_sqft'),
          'Property Tax': combineAndFormatValues(
            {
              gross_taxes: Number(cp.gross_taxes),
              tax_year: Number(cp.tax_year),
            },
            'gross_taxes',
            'tax_year',
          ),
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
        const sliced = phts?.slice(3, 7);

        return cloneElement(
          child,
          { ...child.props },
          sliced.map((src, i) => (
            <div
              key={`gallery #${i}`}
              onClick={() => {
                showGallery(i + 3);
              }}
              className='relative w-full h-full overflow-hidden rounded-lg'
            >
              <Image src={src as string} alt={`gallery #${i}`} fill style={{ objectFit: 'cover' }} />
            </div>
          )),
        );
      },
    },
    {
      searchFn: searchByClasses(['div-features-block']),
      transformChild: (child: ReactElement) => {
        return <RxFeatures child={child} features={mapFeatures(currentProperty as PropertyDataModel)} />;
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

  return (
    <>
      <button
        onClick={() => {
          showGallery(0);
        }}
        className='text-7xl bg-fuchsia-600 text-white'
      >
        show carousel
      </button>

      {currentProperty ? <>{transformMatchingElements(child, matches)}</> : child}
      <PhotosCarousel />
    </>
  );
}
