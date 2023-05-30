import React, { cloneElement, ReactElement } from 'react';
import Image from 'next/image';

import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { PropertyDataModel, MLSProperty } from '@/_typings/property';
import { ReplacerPageProps } from '@/_typings/forms';
import { getFeatureIcons } from '@/_helpers/functions';
import { replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { combineAndFormatValues, formatValues } from '@/_utilities/data-helpers/property-page';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

import PhotosGrid from '@/components/RxProperty/PhotosGrid';
import RxPropertyTopStats from '@/components/RxProperty/RxPropertyTopStats';
import RxPropertyMaps from '@/components/RxProperty/RxPropertyMaps';
import RxFeatures from '@/components/RxProperty/RxFeatures';
import RxPropertyStats from '@/components/RxProperty/RxPropertyStats';
import RxTable from '@/components/RxTable';
import RxSimilarListings from '@/components/RxProperty/RxSimilarListings';

export function RxDetailedListing(props: ReplacerPageProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_IMAGES]),
      transformChild: (child: ReactElement) => {
        const photos = props?.property?.photos ? props?.property?.photos : [];
        const cdnPhotos = photos.map(link => getImageSized(link));
        return props?.property ? <PhotosGrid child={child} photos={cdnPhotos} /> : child;
      },
    },
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_STATS]),
      transformChild: (child: ReactElement) => {
        const el = [cloneElement(child.props.children) as ReactElement];
        return props?.property ? (
          <RxPropertyTopStats nodeClassName={child.props.className} nodeProps={child.props} agent={props?.agent} property={props.property}>
            {el}
          </RxPropertyTopStats>
        ) : (
          child
        );
      },
    },
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_BEDS_BATHS]),
      transformChild: (child: ReactElement) => {
        return props?.property
          ? (replaceAllTextWithBraces(child, {
              Beds: props.property?.beds,
              Baths: props.property?.baths,
              'Year Built': props.property?.year_built,
              Sqft: props.property?.floor_area,
              Area: props.property?.area,
              Description: props.property?.description,
              'Listing By': props.property?.listing_by,
            }) as ReactElement)
          : child;
      },
    },
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_MAPS]),
      transformChild: (child: ReactElement) => {
        return <RxPropertyMaps child={child} property={props.property} />;
      },
    },
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_STATS_W_ICONS]),
      transformChild: (child: ReactElement) => {
        const cp: PropertyDataModel | { [key: string]: string } = props.property || {};
        return replaceAllTextWithBraces(child, {
          'Building Type': cp?.property_type,
          'MLS Number': cp?.mls_id,
          'Lot Size': cp.lot_sqm ? `${formatValues(cp, 'lot_sqm')}m²` : cp.lot_sqft ? `${formatValues(cp, 'lot_sqft')}ft²` : 'Not Applicable',
          'Land Title': cp?.land_title,
          'Price Per Sqft': cp.price_per_sqft ? formatValues(cp, 'price_per_sqft') : 'N/A',
          'Property Tax': cp.gross_taxes
            ? combineAndFormatValues(
                {
                  gross_taxes: Number(cp.gross_taxes),
                  tax_year: Number(cp.tax_year),
                },
                'gross_taxes',
                'tax_year',
              )
            : 'N/A',
        }) as ReactElement;
      },
    },
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_IMAGES_COLLECTION]),
      transformChild: (child: ReactElement) => {
        const cp: PropertyDataModel | { [key: string]: string } = props.property || {};
        const phts = cp && Array.isArray(cp.photos) ? cp.photos : [];
        const sliced = phts?.slice(0, 4).map(link => getImageSized(link));
        return cloneElement(
          child,
          { ...child.props },
          sliced.map((src, i) => (
            <div key={`gallery #${i}`} className='relative w-full h-full overflow-hidden rounded-lg'>
              <Image src={src as string} alt={`gallery #${i}`} fill style={{ objectFit: 'cover' }} />
            </div>
          )),
        );
      },
    },
    {
      searchFn: searchByClasses(['section-big-stats']),
      transformChild: (child: ReactElement) => {
        return <RxPropertyStats property={props.property} child={child} agent={props.agent} />;
      },
    },
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_FEATURES]),
      transformChild: (child: ReactElement) => {
        const cp: PropertyDataModel | { [key: string]: string } = props.property || {};
        return <RxFeatures child={child} features={getFeatureIcons(cp as PropertyDataModel)} />;
      },
    },
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_BUILD_HISTORY]),
      transformChild: (child: ReactElement) => {
        const cp = props.property as unknown as { [key: string]: string } as MLSProperty;
        return cp.neighbours && (cp.neighbours as unknown as MLSProperty[]).length && cp.AddressUnit ? (
          <RxTable rows={child.props.children} data={cp.neighbours as unknown as MLSProperty[]} rowClassName='div-building-units-on-sale' />
        ) : (
          ((<></>) as ReactElement)
        );
      },
    },
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_SOLD_HISTORY]),
      transformChild: (child: ReactElement) => {
        const cp = props.property as unknown as { [key: string]: string } as MLSProperty;
        return cp.sold_history && (cp.sold_history as unknown as MLSProperty[]).length && cp.AddressUnit ? (
          <RxTable rows={child.props.children} data={cp.sold_history as unknown as MLSProperty[]} rowClassName='div-sold-history' />
        ) : (
          ((<></>) as ReactElement)
        );
      },
    },
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.SIMILAR_LISTINGS]),
      transformChild: (child: ReactElement) => {
        return (
          <RxSimilarListings className={child.props.className} property={props.property as unknown as { [key: string]: string }}>
            {child.props.children as ReactElement[]}
          </RxSimilarListings>
        );
      },
    },
  ];

  return <>{props?.property ? transformMatchingElements(props.nodes, matches) : props.nodes}</>;
}
