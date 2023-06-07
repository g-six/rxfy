'use client';
import { CSSProperties, ReactElement, cloneElement } from 'react';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import Image from 'next/image';
import { classNames } from '@/_utilities/html-helper';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events } from '@/_typings/events';

type PropertyCarouselProps = {
  photos: string[];
  child: ReactElement;
  showGallery?: (key: number) => void;
};
export default function PhotosGrid({ showGallery, photos, child }: PropertyCarouselProps) {
  //const hasClientNote = false;
  const wrapperStyles: CSSProperties = { overflow: 'hidden;', position: 'relative' };
  const show = showGallery
    ? showGallery
    : (key: number) => {
        fireCustomEvent({ show: true, key }, Events.PropertyGalleryModal);
      };
  //const [clientNote] = useState(captureMatchingElements(child, [{ elementName: 'clientNote', searchFn: searchByClasses(['comment-box']) }]));
  const matches: tMatch[] = [
    { searchFn: searchByClasses(['property-images-lightbox']), transformChild: child => <>{child.props.children}</> },
    {
      searchFn: searchByClasses(['property-image-wrapper']),
      transformChild: child => <div className={`${child.props.className} ${!photos?.[1] ? 'xl:col-span-2' : ''} `}>{child.props.children}</div>,
    },
    {
      searchFn: searchByClasses(['property-images-more']),
      transformChild: child => <div className={`${child.props.className} ${!photos?.[1] ? 'hidden' : ''} `}>{child.props.children}</div>,
    },
    {
      searchFn: searchByClasses(['property-image-main']),
      transformChild: (child: ReactElement) => {
        return (
          <div style={wrapperStyles} onClick={() => show(0)} className={classNames(child.props.className, ` `)}>
            <Image alt='main' src={photos?.[0]} fill style={{ objectFit: 'cover' }} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['image-wrapper-top']),
      transformChild: (child: ReactElement) => {
        return photos?.[1] ? (
          <div style={wrapperStyles} onClick={() => show(1)} className={classNames(child.props.className, ` `)}>
            <Image alt='main' src={photos?.[1]} fill width={800} style={{ objectFit: 'cover' }} />
          </div>
        ) : (
          <></>
        );
      },
    },
    {
      searchFn: searchByClasses(['image-wrapper-bottom']),
      transformChild: (child: ReactElement) => {
        return photos?.[2] ? (
          <div style={wrapperStyles} onClick={() => show(2)} className={classNames(child.props.className, ' ')}>
            <Image alt='main' src={photos?.[2]} fill style={{ objectFit: 'cover' }} />
          </div>
        ) : (
          <></>
        );
      },
    },
  ];
  return <>{transformMatchingElements(cloneElement(child), matches)}</>;
}
