import React, { cloneElement, ReactElement } from 'react';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import { PropertyDataModel, MLSProperty } from '@/_typings/property';
import { ReplacerPageProps } from '@/_typings/forms';
import { fireCustomEvent, getFeatureIcons } from '@/_helpers/functions';
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
import { AgentData } from '@/_typings/agent';
import PhotosCarousel from '../RxPropertyCarousel/PhotosCarousel';
import { searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { Events } from '@/_typings/events';
import RxSecondPhotosGrid from '../RxProperty/RxSecondPhotosGrid';

export function RxDetailedListing(props: ReplacerPageProps) {
  const photos = props?.property?.photos ? props?.property?.photos : [];
  const cdnPhotos = photos.map(link => getImageSized(link));
  const showGallery = (key: number) => {
    fireCustomEvent({ show: true, key }, Events.PropertyGalleryModal);
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses([WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_IMAGES]),
      transformChild: (child: ReactElement) => {
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
      searchFn: searchByClasses(['little-profile-card']),
      transformChild: (child: ReactElement) => {
        const agent: AgentData = props.agent || {};

        return replaceAllTextWithBraces(child, {
          'Agent Name': 'asd',
        }) as ReactElement;
      },
    },
    {
      searchFn: searchByClasses(['legal-1']),
      transformChild: (child: ReactElement) => {
        return replaceAllTextWithBraces(child, {
          'Property Data Source Legal': props.property?.real_estate_board?.data?.attributes?.legal_disclaimer,
        }) as ReactElement;
      },
    },
    // { searchFn: searchByClasses(['property-lightbox-2']), transformChild: child => <div className={'property-lightbox-2'}>{child.props.children}</div> },
    {
      searchFn: searchByPartOfClass([WEBFLOW_NODE_SELECTOR.PROPERTY_IMAGES_COLLECTION]),
      transformChild: (child: ReactElement) => {
        const cp: PropertyDataModel | { [key: string]: string } = props.property || {};
        const phts = cp && Array.isArray(cp.photos) ? cp.photos : [];
        const sliced = phts?.slice(3, 7).map(link => getImageSized(link));
        return sliced?.length > 0 ? <RxSecondPhotosGrid child={child} photos={sliced} /> : <></>;
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

  return (
    <>
      {props?.property ? transformMatchingElements(props.nodes, matches) : props.nodes}
      {cdnPhotos?.length > 1 && <PhotosCarousel propertyPhotos={cdnPhotos ?? []} />}
    </>
  );
}
