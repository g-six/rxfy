'use client';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events } from '@/_typings/events';
import Image from 'next/image';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  child: ReactElement;
  photos: string[];
};

export default function RxSecondPhotosGrid({ child, photos }: Props) {
  const show = (key: number) => {
    fireCustomEvent({ show: true, key }, Events.PropertyGalleryModal);
  };
  return cloneElement(
    child,
    { className: child.props.className },
    photos.map((src, i) => (
      <div
        key={`gallery #${i}`}
        onClick={() => {
          show(i);
        }}
        className='relative w-full h-full overflow-hidden rounded-lg brrr'
      >
        <Image src={src as string} alt={`gallery #${i}`} fill style={{ objectFit: 'cover' }} />
      </div>
    )),
  );
}
