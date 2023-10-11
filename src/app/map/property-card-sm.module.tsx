'use client';
import React, { createRef } from 'react';
import { classNames } from '@/_utilities/html-helper';
import styles from './property-card-sm.module.scss';
import { XMarkIcon } from '@heroicons/react/24/solid';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { Transition } from '@headlessui/react';
import { PropertyDataModel } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import useLove from '@/hooks/useLove';

function Iterator({
  children,
  property,
  updateLove,
  loves,
}: {
  children: React.ReactElement;
  property: PropertyDataModel;
  updateLove(): void;
  loves: string[];
}) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      const { children: subchildren, className: subclass, ...props } = c.props || {};

      // If this is the image thumbnail
      if (subclass?.includes('propcard-image-small') && property.cover_photo) {
        return (
          <div className={classNames(subclass || '', 'overflow-hidden', 'rexified', 'child-of-PropertyCardSm', styles.CoverPhoto)} {...props}>
            <a
              href={`property?mls=${property.mls_id}`}
              title={property.title}
              style={{
                backgroundImage: `url(${getImageSized(property.cover_photo, 210)})`,
              }}
            />
            {/* <Image alt={property.title} src={getImageSized(property.cover_photo, 210)} width={210} height={170} /> */}
          </div>
        );
      }

      if (props['data-field'] === 'address') {
        return (
          <a href={`property?mls=${property.mls_id}`} className={classNames(subclass, 'flex flex-wrap gap-x-1')}>
            <span>{property.title}</span>
            <span>{property.area || property.city}</span>
          </a>
        );
      }
      if (props['data-field'] === 'area') {
        return <div className={classNames(subclass, 'sm:hidden')}>{property.area || property.city}</div>;
      }

      if (subclass?.includes('heart-full')) {
        return React.cloneElement(
          <button
            type='button'
            className={classNames(subclass, styles.heart, !loves || !loves.includes(property.mls_id) ? 'opacity-0 hover:opacity-100' : 'opacity-100')}
            onClick={() => {
              updateLove();
            }}
          ></button>,
          props,
          subchildren,
        );
      }
      if (subclass?.includes('heart-empty')) {
        if (loves && loves.includes(property.mls_id)) {
          return <></>;
        }
        return React.cloneElement(
          <button
            type='button'
            className={classNames(subclass, styles.heart)}
            onClick={() => {
              updateLove();
            }}
          ></button>,
          props,
          subchildren,
        );
      }

      const kv = property as unknown as {
        [k: string]: string;
      };

      // Since we have property.price short-formatted for map,
      // let's get the full original price
      kv.price = formatValues(property, 'asking_price');

      return (
        <div className={classNames(subclass || '', 'rexified', 'child-of-PropertyCardSm')} {...props}>
          <Iterator {...props} property={property}>
            {props['data-field'] ? <a href={`property?mls=${property.mls_id}`}>{formatValues(kv, props['data-field'])}</a> : subchildren}
          </Iterator>
        </div>
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default function PropertyCardSm({ agent, children, className }: { agent: number; children: React.ReactElement; className: string }) {
  const evt = useEvent(Events.MapClusterModal);
  const blanketRef = createRef<HTMLDivElement>();
  const { fireEvent: doLove } = useLove();
  const [loves, setLoves] = React.useState(getData(Events.LovedItem) as unknown as string[]);

  const { cluster } = evt.data as unknown as {
    cluster: PropertyDataModel[];
  };

  return (
    <Transition
      show={(cluster && cluster.length > 0) || false}
      as={'div'}
      enterFrom='opacity-0'
      enter='transform ease-out duration-300 transition'
      enterTo='opacity-100'
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
      className='h-full w-full py-40'
    >
      <div className={classNames(className, 'mx-auto')}>
        <div className={styles.Cards}>
          {cluster &&
            cluster.map(property => (
              <div className={styles.Card} key={property.id} id={`property--id-${property.id}--mls-${property.id}`}>
                <Iterator
                  loves={loves}
                  updateLove={() => {
                    doLove(
                      {
                        ...property,
                        love: 0,
                      },
                      agent,
                      loves.includes(property.mls_id),
                    );
                    setLoves(loves.includes(property.mls_id) ? loves.filter(mls_id => mls_id !== property.mls_id) : loves.concat([property.mls_id]));
                  }}
                  property={property}
                >
                  {children}
                </Iterator>
              </div>
            ))}
        </div>
        <button
          type='button'
          className='bg-black rounded-full absolute -top-2 -right-2 px-1 flex flex-col items-center justify-center'
          onClick={() => {
            evt.fireEvent({} as unknown as EventsData);
          }}
        >
          <XMarkIcon className='text-white w-4 h-4'></XMarkIcon>
        </button>
      </div>
    </Transition>
  );
}
