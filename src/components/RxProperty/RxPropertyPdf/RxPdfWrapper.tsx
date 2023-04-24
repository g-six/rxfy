'use client';
import React from 'react';
import html2canvas from 'html2canvas';
const QRious = require('qrious');

import { MLSProperty } from '@/_typings/property';
import { ReplacerPageProps, DataUrl, disclaimer } from '@/_typings/forms';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import {
  combineAndFormatValues,
  formatValues,
  construction_stats,
  dimension_stats,
  main_stats,
  building_stats,
  financial_stats,
  amenities_stats,
} from '@/_utilities/data-helpers/property-page';
import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { splitObject, toDataURL } from '@/_helpers/functions';

import RxPdfStatsInfo from '@/components/RxProperty/RxPropertyPdf/RxPdfStatsInfo';
import RxPdfGallery from '@/components/RxProperty/RxPropertyPdf/RxPdfGallery';
import RxPdfRoomStats from '@/components/RxProperty/RxPropertyPdf/RxPdfRoomStats';
import rendererPdf, { PAGE_IMG_HEIGHT, PAGE_IMG_WIDTH } from '@/_helpers/pdf-renderer';

type MLSPropertyData = MLSProperty & {
  agent_info?: {
    company?: string;
    name?: string;
    email?: string;
    tel?: string;
  };
};

export default function RxPdfWrapper({ nodes, agent, property, nodeClassName }: ReplacerPageProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pictures, setPictures] = React.useState({ image: '', photo: '', google: '', qr: '' });
  const [photos, setPhotos] = React.useState<string[]>([]);

  const amenitiesSplit = splitObject(amenities_stats);

  // @ts-ignore
  const matches = [
    {
      searchFn: searchByClasses(['b-topleft']),
      transformChild: (child: React.ReactElement) => {
        const el = React.cloneElement(child, {
          style: { maxHeight: Math.round(PAGE_IMG_HEIGHT * 0.55) + 'px' },
        });
        return replaceAllTextWithBraces(el, {
          Price: property ? formatValues(property, 'AskingPrice') : '',
          Address: property?.Address || '',
          description: property?.L_PublicRemakrs,
          City: property?.City,
          Area: property?.City === property?.Area ? '' : property?.Area,
          Be: property?.L_BedroomTotal,
          Ba: property?.L_TotalBaths,
          Sqft: property?.L_FloorArea_Total,
          Year: property?.L_YearBuilt,
        }) as React.ReactElement;
      },
    },
    {
      searchFn: searchByClasses(['stat-level2']),
      transformChild: (child: React.ReactElement) =>
        replaceAllTextWithBraces(child, {
          'Building Type': property?.PropertyType,
          'Property Tax': combineAndFormatValues({
            L_GrossTaxes: property?.L_GrossTaxes || '',
            ForTaxYear: property?.ForTaxYear || '',
          }),
          'MLS Number': property?.MLS_ID,
          'Land Title': property?.LandTitle,
        }) as React.ReactElement,
    },
    {
      searchFn: searchByClasses(['b-agentimage']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          children: <></>,
          style: pictures?.photo
            ? {
                backgroundImage: `url(${pictures.photo})`,
                backgroundPosition: 'center center',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
              }
            : {},
        }),
    },
    {
      searchFn: searchByClasses(['b-featimage']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          style: pictures?.image
            ? {
                backgroundImage: `url(${pictures.image})`,
                backgroundPosition: 'center center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              }
            : {},
        });
      },
    },
    {
      searchFn: searchByClasses(['b-map']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          style: pictures?.google
            ? {
                backgroundImage: `url(${pictures.google})`,
                backgroundPosition: 'center center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              }
            : {},
        });
      },
    },
    {
      searchFn: searchByClasses(['qr-placeholder']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          ...child.props,
          children: <></>,
          style: pictures?.qr
            ? {
                backgroundImage: `url(${pictures.qr})`,
                backgroundPosition: 'center center',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
              }
            : {},
        });
      },
    },
    {
      searchFn: searchByClasses(['b-agentinfo']),
      transformChild: (child: React.ReactElement) => {
        const p = property as MLSPropertyData;
        return replaceAllTextWithBraces(child, {
          'Agent Name': agent.full_name,
          'Agent Phone': agent.phone,
          'Agent Email': agent.email,
          'Agent Address': agent.street_1 ? agent.street_1 + ' ' + agent.street_2 : 'N/A',
          'p-courtesy': `${p?.agent_info?.name || ''} of ${p?.agent_info?.company || ''}`,
          legal: disclaimer.REBGV,
        }) as React.ReactElement;
      },
    },
    {
      searchFn: searchByClasses(['construnction-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property}
            nodeClassName={child.props.className}
            child={child}
            stats={construction_stats}
            wrapperClassName={'construnction-info-rows'}
            keyStr={'constat'}
            valStr={'conresult'}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['dimensions-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property}
            nodeClassName={child.props.className}
            child={child}
            stats={dimension_stats}
            wrapperClassName={'dimentions-info-rows'}
            keyStr={'dimstat'}
            valStr={'dimresult'}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['main-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property}
            nodeClassName={child.props.className}
            child={child}
            stats={main_stats}
            wrapperClassName={'main-info-rows'}
            keyStr={'PIStat'}
            valStr={'PIResult'}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['building-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property}
            nodeClassName={child.props.className}
            child={child}
            stats={building_stats}
            wrapperClassName={'build-info-rows'}
            keyStr={'PIStat'}
            valStr={'PIResult'}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['financial-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property}
            nodeClassName={child.props.className}
            child={child}
            stats={financial_stats}
            wrapperClassName={'financial-info-rows'}
            keyStr={'FinStat'}
            valStr={'FinResult'}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['amenities-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property}
            nodeClassName={child.props.className}
            child={child}
            stats={amenitiesSplit.first}
            wrapperClassName={'aminities-info-rows'}
            keyStr={'amstat'}
            valStr={'amresult'}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['amenities-info-2']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property}
            nodeClassName={child.props.className}
            child={child}
            stats={amenitiesSplit.second}
            wrapperClassName={'amenities-info-rows'}
            keyStr={'amstat'}
            valStr={'amresult'}
          />
        );
      },
    },
    {
      searchFn: searchByClasses(['rooms-info']),
      transformChild: (child: React.ReactElement) => {
        return <RxPdfRoomStats property={property} nodeClassName={child.props.className} child={child} />;
      },
    },
    {
      searchFn: searchByClasses(['imagegrid']),
      transformChild: (child: React.ReactElement) => {
        return <RxPdfGallery photos={photos} child={child} />;
      },
    },
  ];

  React.useEffect(() => {
    const hasPictures = pictures.image || pictures.photo;
    if (ref && ref.current && property?.AskingPrice && hasPictures && photos.length) {
      const promises = Array.from(ref.current.children)
        .map(el => el as HTMLElement)
        .map(el => {
          el.style.width = PAGE_IMG_WIDTH + 'px';
          el.style.height = PAGE_IMG_HEIGHT + 'px';
          return html2canvas(el, { allowTaint: true });
        });
      Promise.all(promises).then(pagesAsCanvas => {
        rendererPdf({
          images: pagesAsCanvas,
          name: property?.Address || 'Brochure',
          inWindow: true,
        });
      });
    }
  }, [ref, property, pictures, photos]);

  React.useEffect(() => {
    if (property && !pictures.image && !pictures.photo) {
      const image = property.photos && Array.isArray(property.photos) && property.photos.length ? property.photos[0] : '';

      let photo = agent.metatags.logo_for_light_bg;
      photo = photo ? photo : agent.metatags.logo_for_dark_bg;
      photo = photo ? photo : agent.metatags.profile_image;
      photo = photo ? photo : '';

      const google = `https://maps.googleapis.com/maps/api/staticmap?center=${property.lat},${property.lng}&zoom=13&size=883x259&scale=2&markers=${property.lat},${property.lng}&maptype=roadmap&key=${process.env.NEXT_PUBLIC_GGL_KEY}`;
      const qrPromise = new Promise(resolve => {
        const link = `https://${window.location.host}/property?mls=${property.MLS_ID}`;
        const qr = new QRious({ backgroundAlpha: 0, value: link });
        resolve(qr.toDataURL());
      });
      Promise.all([toDataURL(image), toDataURL(photo), toDataURL(google), qrPromise]).then(pics =>
        setPictures({
          image: (pics[0] as DataUrl).base64,
          photo: (pics[1] as DataUrl).base64,
          google: (pics[2] as DataUrl).base64,
          qr: pics[3] as string,
        }),
      );
    }
  }, [pictures, property, agent]);

  React.useEffect(() => {
    if (property && !photos.length) {
      const array = Array.isArray(property.photos) ? property.photos : [];
      const promises = array.map(url => toDataURL(url));
      Promise.all(promises).then(data => {
        const urlData = data as unknown as DataUrl[];
        setPhotos(urlData.map(d => d.base64));
      });
    }
  }, [property]);

  return (
    <div ref={ref} className={nodeClassName}>
      {transformMatchingElements(nodes, matches)}
    </div>
  );
}
