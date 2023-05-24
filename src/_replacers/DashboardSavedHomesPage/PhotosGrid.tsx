'use client';
import { ReactElement, ReactNode, cloneElement, useEffect, useState } from 'react';
import { captureMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import Image from 'next/image';
import { classNames } from '@/_utilities/html-helper';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events } from '@/_typings/events';

type CarouselPhoto = {
  url: string;
  title: string;
};
type PropertyCarouselProps = {
  photos: string[];
  child: ReactElement;
  showGallery?: (key: number) => void;
};
export default function PhotosGrid({ showGallery, photos, child }: PropertyCarouselProps) {
  const hasClientNote = false;
  const show = showGallery
    ? showGallery
    : () => {
        fireCustomEvent({ show: true, photos: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] }, Events.PropertyGalleryModal);
      };
  const [clientNote] = useState(captureMatchingElements(child, [{ elementName: 'clientNote', searchFn: searchByClasses(['comment-box']) }]));
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['property-image-main']),
      transformChild: (child: ReactElement) => {
        return (
          <div onClick={() => show(0)} className={classNames(child.props.className, 'relative overflow-hidden ')}>
            <Image alt='main' src={photos?.[0]} fill style={{ objectFit: 'cover' }} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['property-image-2']),
      transformChild: (child: ReactElement) => {
        return (
          <div onClick={() => show(1)} className={classNames(child.props.className, 'relative overflow-hidden ')}>
            <Image alt='main' src={photos?.[1]} fill style={{ objectFit: 'cover' }} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['comment-box']),
      transformChild: (child: ReactElement) => {
        return (
          <div onClick={() => show(2)} className={classNames(child.props.className, 'relative overflow-hidden ')}>
            <Image alt='main' src={photos?.[2]} fill style={{ objectFit: 'cover' }} />
          </div>
        );
      },
    },
  ];
  return <>{transformMatchingElements(cloneElement(child), matches)}</>;
}
