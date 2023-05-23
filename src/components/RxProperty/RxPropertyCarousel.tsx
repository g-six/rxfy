'use client';
import { ChevronLeftIcon, ChevronRightIcon, XCircleIcon } from '@heroicons/react/20/solid';
import { ReactNode, useEffect, useState } from 'react';
import styles from './RxPropertyCarousel.module.scss';
import useEvent, { Events } from '@/hooks/useEvent';

type CarouselPhoto = {
  url: string;
  title: string;
};
type PropertyCarouselProps = {
  children: ReactNode;
};
export default function RxPropertyCarousel(props: PropertyCarouselProps) {
  const e = useEvent(Events.TogglePhotoSliderModal);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentStripScrollX, setStripScrollX] = useState(0);
  const [photos, setPhotos] = useState<CarouselPhoto[]>([]);
  useEffect(() => {
    let phts: CarouselPhoto[] = [];
    document
      .querySelectorAll('.property-image-wrapper .cursor-pointer, .property-images-more .cursor-pointer, .section-images .cursor-pointer')
      .forEach((el: Element) => {
        el.addEventListener('click', evt => {
          const nth = Number(el.getAttribute('data-nth-child'));
          if (!isNaN(nth)) {
            e.fireEvent({
              show: true,
            });
            setCurrentPhotoIndex(nth - 1);
          }
        });
      });
    document.querySelectorAll('.property-carousel-item[data-src]').forEach((el: Element, idx: number) => {
      let url = el.getAttribute('data-src') as string;
      url = `${process.env.NEXT_PUBLIC_IM_ENG}/w_1920/${url}`;
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

  const scrollStripLeft = () => {
    if (currentStripScrollX < 0) setStripScrollX(currentStripScrollX + 4);
  };
  const scrollStripRight = () => {
    const el = document.querySelector('.aspect-square:last-child');
    if (el) {
      if (document.body.getBoundingClientRect().width < el.getBoundingClientRect().right - 20) {
        setStripScrollX(currentStripScrollX - 4);
      }
    }
  };

  return (
    <>
      <div className={`${e.data?.show ? 'fixed' : 'hidden'} h-screen w-screen rexified overflow-hidden top-0 left-0 z-[9999]`} id={styles.Wrapper}>
        <button
          type='button'
          className='absolute w-12 h-12 top-1/2 -translate-y-12 left-2 z-10 text-center flex items-center justify-center p-0 rounded-full bg-transparent'
          onClick={() => {
            handlePrevClick();
          }}
        >
          <ChevronLeftIcon className='w-8 h-8 text-white' />
        </button>
        <div id={styles.RxPropertyCarousel}>
          {photos.map((photo, index) => (
            <div
              key={index}
              className={`${index === currentPhotoIndex ? currentPhotoIndex : 'hidden'} relative overflow-x-hidden`}
              style={{ backgroundImage: `url(${photo.url})` }}
            />
          ))}
        </div>
        <div id={styles.RxPropertyThumb}>
          <button
            type='button'
            className='w-10 h-10 text-center flex items-center justify-center p-0 rounded-full bg-transparent'
            onClick={() => {
              scrollStripLeft();
            }}
          >
            <ChevronLeftIcon className='w-8 h-8 text-white' />
          </button>
          <div className={styles.filmStrip}>
            <div
              className={styles.innerStrip}
              style={{
                left: currentStripScrollX < 0 ? `${currentStripScrollX * 4.25}rem` : '',
              }}
            >
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`${index === currentPhotoIndex ? 'opacity-100' : 'opacity-40'} relative overflow-hidden aspect-square`}
                  style={{ backgroundImage: `url(${photo.url})`, backgroundColor: 'white' }}
                  onClick={() => {
                    setCurrentPhotoIndex(index);
                  }}
                />
              ))}
            </div>
          </div>
          <button
            type='button'
            className='w-10 h-10 text-center flex items-center justify-center p-0 rounded-full bg-transparent'
            onClick={() => {
              scrollStripRight();
            }}
          >
            <ChevronRightIcon className='w-8 h-8 text-white' />
          </button>
        </div>
        <button
          type='button'
          className='absolute w-12 h-12 top-1/2 -translate-y-12 right-6 text-center flex items-center justify-center p-0 rounded-full bg-transparent'
          onClick={() => {
            handleNextClick();
          }}
        >
          <ChevronRightIcon className='w-8 h-8 text-white' />
        </button>

        <button
          type='button'
          className='absolute w-8 h-8 top-4 right-8 text-center flex items-center justify-center p-0 rounded-full bg-transparent text-white text-4xl font-thin'
          onClick={() => {
            e.fireEvent({
              show: false,
            });
          }}
        >
          &times;
        </button>
      </div>
      {props.children}
    </>
  );
}
