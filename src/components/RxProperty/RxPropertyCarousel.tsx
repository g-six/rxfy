'use client';
import Image from 'next/image';
import { ReactNode, useEffect, useState } from 'react';

type CarouselPhoto = {
  url: string;
  title: string;
};
type PropertyCarouselProps = {
  children: ReactNode;
  photos: string[];
};
export default function RxPropertyCarousel(props: PropertyCarouselProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<CarouselPhoto[]>([]);

  useEffect(() => {
    let phts: CarouselPhoto[] = [];
    document.querySelectorAll('[data-carousel-photo]').forEach((el: Element, idx: number) => {
      let url = el.getAttribute('data-carousel-photo') as string;
      url = `https://e52tn40a.cdn.imgeng.in/w_1920/${url}`;
      phts.push({
        url,
        title: `Photo ${idx}`,
      });
    });
    setPhotos(phts);
  }, []);

  const handlePrevClick = () => {
    if (currentPhotoIndex === 0) {
      setCurrentPhotoIndex(photos.length - 1);
    } else {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPhotoIndex === photos.length - 1) {
      setCurrentPhotoIndex(0);
    } else {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  return photos && photos.length ? (
    <>
      <div className='w-full hidden relative h-screen'>
        <button
          type='button'
          className='absolute w-6 h-6 top-1/2 left-0 z-10'
          onClick={() => {
            handlePrevClick();
          }}
        >
          Prev
        </button>
        <div className='absolute top-0 h-screen z-0 w-screen'>
          {photos.map((photo, index) => (
            <div key={index} className='relative h-screen max-w-screen-xl w-full'>
              <Image src={photo.url} alt={photo.title} className='w-full' fill />
            </div>
          ))}
        </div>
        <button
          type='button'
          className='absolute w-6 h-6 top-1/2 right-0'
          onClick={() => {
            handlePrevClick();
          }}
        >
          Next
        </button>
      </div>
      {props.children}
    </>
  ) : (
    <>No photos</>
  );
}
