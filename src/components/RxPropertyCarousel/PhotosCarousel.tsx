import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import './PhotoCarouselOverwrite.scss';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import styles from './PhotoCarousel.module.scss';
import { Swiper as SwiperType, FreeMode, Navigation, Thumbs } from 'swiper';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import useEvent, { Events } from '@/hooks/useEvent';

interface Props {}
export default function App({}: Props) {
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  const { data, fireEvent } = useEvent(Events.PropertyGalleryModal);
  const { key, show, photos } = data || {};
  const closeModal = () => {
    fireEvent({ show: false, photos: [] });
  };
  useEffect(() => {
    if (document) {
      document.body.style.overflow = show ? 'hidden' : 'auto';
      mainSwiper?.slideTo(key ?? 0);
    }
  }, [show, mainSwiper, key]);

  return (
    <div
      className={`${styles.PhotoCarousel} PhotoCarousel fixed z-[901] top-0 left-0 w-screen h-screen  ${
        show ? 'bg-black/90 opacity-100' : 'bg-black/0 opacity-0 pointer-events-none'
      } p-5 gap-5`}
    >
      {' '}
      <div className='flex justify-end'>
        <button onClick={closeModal} className='bg-transparent  z-[901]'>
          <XMarkIcon className='text-white w-10 h-10' />
        </button>
      </div>{' '}
      <div className='w-full h-full  mx-auto relative overflow-hidden'>
        <button
          id='slider-next'
          className='absolute right-0 cursor-pointer z-[901] h-full px-2 opacity-70 transition-all duration-300  bg-black/0 hover:opacity-100 hover:bg-black/10'
        >
          <ChevronRightIcon className='w-14 h-14 text-white ' />
        </button>
        <button
          id='slider-prev'
          className={`absolute left-0 cursor-pointer z-[901] h-full px-2 opacity-70 transition-all duration-300  bg-black/0 hover:opacity-100 hover:bg-black/10`}
        >
          <ChevronLeftIcon className='w-14 h-14 text-white' />
        </button>
        <Swiper
          style={{
            height: '100%',
          }}
          loop={true}
          spaceBetween={10}
          navigation={{ nextEl: '#slider-next', prevEl: '#slider-prev' }}
          thumbs={{ swiper: thumbsSwiper }}
          onSwiper={(swiper: SwiperType) => {
            setMainSwiper(swiper);
          }}
          modules={[FreeMode, Navigation, Thumbs]}
          className={`${styles.swiperMain} main-swiper`}
        >
          {photos &&
            photos?.length &&
            photos.map(i => (
              <SwiperSlide key={i} className={styles.swiperSlide}>
                <div className={`${styles.inner} relative`}>
                  <Image fill style={{ objectFit: 'cover' }} sizes='100%' alt='pic' src={i} priority />
                </div>
              </SwiperSlide>
            ))}
        </Swiper>
      </div>
      <div className='h-full flex-shrink-0 w-full flex justify-center mx-auto overflow-hidden z-[901]'>
        <Swiper
          onSwiper={(swiper: SwiperType) => {
            setThumbsSwiper(swiper);
          }}
          style={{ height: '100%' }}
          loop={true}
          spaceBetween={5}
          slidesPerView={7.5}
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className={`${styles.swiperThumbs} thumbs-swiper`}
          wrapperClass={`${styles.wrapper} ${photos && photos?.length < 8 ? styles.centered : ''}`}
        >
          {photos &&
            photos?.length &&
            photos.map(i => (
              <SwiperSlide key={i}>
                <div className={`${styles.inner} relative h-full`}>
                  <Image fill style={{ objectFit: 'cover' }} sizes='100%' alt='pic' src={i} priority />
                </div>
              </SwiperSlide>
            ))}
        </Swiper>
      </div>
    </div>
  );
}
