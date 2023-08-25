'use client';
import { fireCustomEvent } from '@/_helpers/functions';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { Events } from '@/hooks/useFormEvent';

export default function RxCarouselPhoto({ idx, photos, width = 1000, ...props }: { idx: number; photos: string[]; width: number }) {
  return (
    <div
      {...props}
      style={{
        backgroundImage: `url(${getImageSized(photos[idx], width)})`,
      }}
      onClick={() => {
        fireCustomEvent({ show: true, photos: (photos ?? []).map(src => getImageSized(src, width)), key: idx }, Events.PropertyGalleryModal);
      }}
    />
  );
}
