'use client';
import { ReactElement, cloneElement } from 'react';
import Image from 'next/image';

import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { classNames } from '@/_utilities/html-helper';

type PropertyCarouselProps = {
  photos: string[];
  child: ReactElement;
};

export default function PhotosGrid({ photos, child }: PropertyCarouselProps) {
  //const hasClientNote = false;
  //const [clientNote] = useState(captureMatchingElements(child, [{ elementName: 'clientNote', searchFn: searchByClasses(['comment-box']) }]));
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['property-image-main']),
      transformChild: (child: ReactElement) => {
        return (
          <div className={classNames(child.props.className, 'relative overflow-hidden ')}>
            <Image alt='main' src={photos?.[0]} fill style={{ objectFit: 'cover' }} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['property-image-2']),
      transformChild: (child: ReactElement) => {
        return (
          <div className={classNames(child.props.className, 'relative overflow-hidden ')}>
            <Image alt='main' src={photos?.[1]} fill style={{ objectFit: 'cover' }} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['comment-box']),
      transformChild: (child: ReactElement) => {
        return (
          <div className={classNames(child.props.className, 'relative overflow-hidden ')}>
            <Image alt='main' src={photos?.[2]} fill style={{ objectFit: 'cover' }} />
          </div>
        );
      },
    },
  ];
  return <>{transformMatchingElements(cloneElement(child), matches)}</>;
}
