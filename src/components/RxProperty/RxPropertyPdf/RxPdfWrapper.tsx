'use client';
import React from 'react';
import html2canvas from 'html2canvas';
const QRious = require('qrious');

import { PropertyDataModel } from '@/_typings/property';
import { ReplacerPageProps, DataUrl, disclaimer } from '@/_typings/forms';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { formatValues, construction_stats, amenities_stats } from '@/_utilities/data-helpers/property-page';
import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { splitObject, toDataURL } from '@/_helpers/functions';

import RxPdfMainInfo from '@/components/RxProperty/RxPropertyPdf/RxPdfMainInfo';
import RxPdfMainStats from '@/components/RxProperty/RxPropertyPdf/RxPdfMainStats';
import RxPdfStatsInfo from '@/components/RxProperty/RxPropertyPdf/RxPdfStatsInfo';
import RxPdfGallery, { PHOTOS_AMOUNT } from '@/components/RxProperty/RxPropertyPdf/RxPdfGallery';
import RxPdfDimRoomsInfo from '@/components/RxProperty/RxPropertyPdf/RxPdfDimRoomsInfo';
import rendererPdf, { getPageImgSize, MAIN_INFO_PART } from '@/_helpers/pdf-renderer';

type MLSPropertyData = PropertyDataModel & {
  agent_info?: {
    company?: string;
    name?: string;
    email?: string;
    tel?: string;
  };
};

export default function RxPdfWrapper({ nodes, agent, property, nodeClassName }: ReplacerPageProps) {
  const PDF_SIZE = 'us';

  const ref = React.useRef<HTMLDivElement>(null);
  const [pictures, setPictures] = React.useState({ image: '', photo: '', google: '', qr: '' });
  const [photos, setPhotos] = React.useState<string[]>([]);

  const amenitiesSplit = splitObject(amenities_stats);
  const pdfSize = getPageImgSize(PDF_SIZE);

  const matches = [
    {
      searchFn: searchByClasses(['b-topleft']),
      transformChild: (child: React.ReactElement) => {
        const el = React.cloneElement(child, {
          style: { maxHeight: Math.round(pdfSize.height * MAIN_INFO_PART) + 'px' },
        });
        return replaceAllTextWithBraces(el, {
          Price: property ? formatValues(property, 'asking_price') : '',
          Address: property?.title || '',
          description: property?.description,
          City: property?.city,
          Area: property?.area || property?.city || '',
          Be: property?.beds,
          Ba: property?.baths,
          Sqft: property ? formatValues(property, 'floor_area_total') : '',
          Year: property?.year_built,
        }) as React.ReactElement;
      },
    },
    {
      searchFn: searchByClasses(['b-topright']),
      transformChild: (child: React.ReactElement) => {
        const style = Object.assign({}, child.props.style, { height: 'auto' });
        const ch = React.cloneElement(child, { style });
        return <RxPdfMainInfo child={ch} property={property} imgPhoto={pictures.image} imgMap={pictures.google} size={PDF_SIZE} />;
      },
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
            property={property as PropertyDataModel & { [key: string]: string }}
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
      searchFn: searchByClasses(['b-statgrid']),
      transformChild: (child: React.ReactElement) => {
        const style = Object.assign({}, child.props.style, {
          height: pdfSize.height - 1230 + 'px',
        });
        const ch = React.cloneElement(child, { style });
        return <RxPdfMainStats child={ch} property={property} size={PDF_SIZE} />;
      },
    },
    {
      searchFn: searchByClasses(['b-statgrid-2']),
      transformChild: (child: React.ReactElement) => {
        const style = Object.assign({}, child.props.style, {
          height: pdfSize.height - 1300 + 'px',
        });
        const ch = React.cloneElement(child, { style });
        return <RxPdfDimRoomsInfo child={ch} property={property} />;
      },
    },
    {
      searchFn: searchByClasses(['amenities-info']),
      transformChild: (child: React.ReactElement) => {
        return (
          <RxPdfStatsInfo
            property={property as PropertyDataModel & { [key: string]: string }}
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
            property={property as PropertyDataModel & { [key: string]: string }}
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
      searchFn: searchByClasses(['imagegrid']),
      transformChild: (child: React.ReactElement) => {
        return <RxPdfGallery photos={photos} child={child} />;
      },
    },
  ];

  React.useEffect(() => {
    const hasPictures = pictures.image || pictures.photo;
    if (ref && ref.current && property?.asking_price && hasPictures && photos.length) {
      const promises = Array.from(ref.current.children)
        .map(el => el as HTMLElement)
        .map(el => {
          el.style.width = pdfSize.width + 'px';
          el.style.height = pdfSize.height + 'px';
          return html2canvas(el, { allowTaint: true });
        });
      Promise.all(promises).then(pagesAsCanvas => {
        rendererPdf({
          images: pagesAsCanvas,
          name: property?.title || 'Brochure',
          inWindow: true,
        });
      });
    }
  }, [ref, property, pictures, photos]);

  React.useEffect(() => {
    if (property && !pictures.image && !pictures.photo) {
      const image = property.photos && Array.isArray(property.photos) && property.photos.length ? property.photos[0] : '';
      const imageFromCdn = image ? getImageSized(image, pdfSize.width) : '';

      let photo = agent.metatags?.profile_image;
      photo = photo ? photo : agent.metatags?.logo_for_dark_bg;
      photo = photo ? photo : agent.metatags?.logo_for_light_bg;
      photo = photo ? photo : '';

      const google = `https://maps.googleapis.com/maps/api/staticmap?center=${property.lat},${property.lon}&zoom=13&size=883x259&scale=2&markers=${property.lat},${property.lon}&maptype=roadmap&key=${process.env.NEXT_PUBLIC_GGL_KEY}`;
      const qrPromise = new Promise(resolve => {
        const link = `https://${window.location.host}/property?mls=${property.mls_id}`;
        const qr = new QRious({ backgroundAlpha: 0, value: link });
        resolve(qr.toDataURL());
      });
      Promise.all([toDataURL(imageFromCdn), toDataURL(photo), toDataURL(google), qrPromise]).then(pics =>
        setPictures({
          image: (pics[0] as DataUrl)?.base64,
          photo: (pics[1] as DataUrl)?.base64,
          google: (pics[2] as DataUrl)?.base64,
          qr: pics[3] as string,
        }),
      );
    }
  }, [pictures, property, agent]);

  React.useEffect(() => {
    if (property && !photos.length) {
      const array = Array.isArray(property.photos) && property.photos.length > 1 ? property.photos : [];
      const photoWidth = Math.ceil(pdfSize.width / 3);
      const promises = array.slice(1, PHOTOS_AMOUNT).map(url => toDataURL(getImageSized(url, photoWidth)));
      Promise.all(promises).then(data => {
        const urlData = data as unknown as DataUrl[];
        setPhotos(urlData.map(d => d?.base64));
      });
    }
  }, [property]);

  return (
    <div ref={ref} className={nodeClassName}>
      {transformMatchingElements(nodes, matches)}
    </div>
  );
}
