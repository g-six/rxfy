import React from 'react';
import { Events } from '@/_typings/events';
import { MLSProperty } from '@/_typings/property';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import useLove from '@/hooks/useLove';

import styles from './RxPropertyCard.module.scss';
import Cookies from 'js-cookie';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

export function PropertyCardSmall(props: Record<string, string>) {
  const [photo] = (props.photos || []) as unknown as string[];
  return (
    <div className={classNames(props.className || '', 'property-card-small smaller relative')}>
      <div className='propcard-image-small shrink-0 w-24 aspect-square bg-cover bg-no-repeat' style={photo ? { backgroundImage: `url(${photo})` } : {}}></div>
      <div className='propcard-small-div'>
        <div className='div-block-9'>
          <div className='price-line'>
            <div className='propcard-price-small'>{formatValues(props, 'AskingPrice')}</div>
            <div className='pcard-small'>
              <div className='propertycard-feature'>
                <div className='propcard-stat'>{formatValues(props, 'L_BedroomTotal')}</div>
                <div className='propcard-stat'>Bed</div>
              </div>
              <div className='propertycard-feature'>
                <div className='propcard-stat'>{formatValues(props, 'L_TotalBaths')}</div>
                <div className='propcard-stat'>Bath</div>
              </div>
              <div className='propertycard-feature'>
                <div className='propcard-stat'>{formatValues(props, 'L_FloorArea_Total')}</div>
                <div className='propcard-stat'>Sqft</div>
              </div>
              <div className='propertycard-feature'>
                <div className='propcard-stat'>{props.year}</div>
              </div>
            </div>
          </div>
          <div className='sold-tag'>
            <div className='text-block-9'>
              <strong className='bold-text'>{props.sold && 'Sold'}</strong>
            </div>
          </div>
        </div>
        <div className='propcard-small-address'>
          <div className='propcard-address capitalize'>{props.address.toLowerCase()}</div>
          <div className='propcard-address truncate text-ellipsis overflow-hidden'>{props.area}</div>
        </div>
        <div className='propertycard-feature-row'>
          <div className='propertycard-feature'>
            <div className='propcard-stat'>{props.beds}</div>
            <div className='propcard-stat'>Bed</div>
          </div>
          <div className='propertycard-feature'>
            <div className='propcard-stat'>{props.baths}</div>
            <div className='propcard-stat'>Bath</div>
          </div>
          <div className='propertycard-feature'>
            <div className='propcard-stat'>{props.sqft}</div>
            <div className='propcard-stat'>Sqft</div>
          </div>
          <div className='propertycard-feature mobno'>
            <div className='propcard-stat'>{props.year}</div>
          </div>
        </div>
      </div>
      <a href={`/property?mls=${props.MLS_ID}`} className='absolute top-0 left-0 w-full h-full'>
        {' '}
      </a>
    </div>
  );
}

function RxComponentChomper({ config, children }: any): any {
  const cloneChildren = React.Children.map(children, child => {
    if (typeof child === 'string') {
      return config[child] || child;
    } else if (React.isValidElement(child)) {
      const RxElement = child as React.ReactElement;
      if (RxElement.props.className && (RxElement.props.className.indexOf('heart-full') >= 0 || RxElement.props.className.indexOf('heart-empty') >= 0)) {
        let opacity_class = 'opacity-0 group-hover:opacity-100';

        let onClick = (e: React.SyntheticEvent) => {};

        if (RxElement.props.className.indexOf('heart-full') >= 0) {
          if (config.loved) {
            opacity_class = 'opacity-100';
            onClick = (e: React.SyntheticEvent) => {
              e.stopPropagation();
              config.onLoveItem(true);
            };
          } else {
            opacity_class = 'opacity-100 group-hover:opacity-0 group-hover:block sm:hidden';
            onClick = (e: React.SyntheticEvent) => {
              e.stopPropagation();
              config.onLoveItem();
            };
          }
        }
        if (RxElement.props.className.indexOf('heart-empty') >= 0) {
          if (!config.loved) {
            opacity_class = 'opacity-0 group-hover:opacity-100 group-hover:block sm:hidden';
          }
          onClick = (e: React.SyntheticEvent) => {
            e.stopPropagation();
            config.onLoveItem(true);
          };
        }

        return React.cloneElement(RxElement, {
          ...RxElement.props,
          className: `z-20 cursor-pointer ${RxElement.props.className} rexified ${opacity_class}`,
          onClick,
          children: RxComponentChomper({
            config,
            children: RxElement.props.children,
          }) as any,
        });
      } else if (RxElement.props.className === 'propcard-details') {
        if (config.mls)
          return React.cloneElement(RxElement, {
            ...RxElement.props,
            className: [RxElement.props.className, 'cursor-pointer'].join(' ').trim(),
            onClick: () => {
              location.href = `/property?mls=${config.mls}`;
            },
            children: RxComponentChomper({
              config,
              children: RxElement.props.children,
            }) as any,
          });
      } else if (child.type !== 'img') {
        //heart-full
        if (RxElement.props.className === 'propcard-image') {
          return React.cloneElement(child, {
            ...RxElement.props,
            className: [RxElement.props.className, config.mls ? 'cursor-pointer' : ''].join(' ').trim(),
            style: config.photos
              ? {
                  backgroundImage: `url(${getImageSized((config.photos as string[])[0], 540)})`,
                }
              : {},
            onClick: () => {
              if (config.mls) {
                location.href = `/property?mls=${config.mls}`;
              }
            },
            children: RxComponentChomper({
              config,
              children: RxElement.props.children,
            }) as any,
          });
        }
      }

      return React.cloneElement(RxElement, {
        ...RxElement.props,
        children: RxComponentChomper({
          config,
          children: RxElement.props.children,
        }) as any,
      });
    }

    return child;
  });

  return <>{cloneChildren}</>;
}

export default function RxPropertyCard({
  sequence,
  children,
  listing,
  agent,
  love,
  isLink = true,
}: {
  love?: number;
  agent?: number;
  sequence?: number;
  children: any;
  listing: MLSProperty;
  isLink?: boolean;
}) {
  const [loved_items, setLovedItems] = React.useState(getData(Events.LovedItem) as unknown as string[]);
  const evt = useLove();

  React.useEffect(() => {
    if (evt.data?.item && evt.data.item.MLS_ID === listing.MLS_ID) {
      setLovedItems(getData(Events.LovedItem) as unknown as string[]);
    }
  }, [evt.data]);

  return (
    <div
      data-agent={agent}
      className={classNames(
        'group relative',
        sequence === 0 ? `` : 'hidden sm:block',
        Cookies.get('session_key') && listing.Status.toLowerCase() === 'sold' ? styles.ShowSold : '',
      )}
    >
      <RxComponentChomper
        config={{
          mls: isLink ? listing.MLS_ID : undefined,
          '{PropCard Address}': listing.Address,
          '{PropertyCard Address}': listing.Address,
          '{PropertyCard Price}': formatValues(listing, 'AskingPrice'),
          '{PArea}': listing.Area || listing.City || 'N/A',
          '{PBd}': listing.L_BedroomTotal || 1,
          '{PBth}': listing.L_TotalBaths,
          '{Psq}': listing.L_FloorArea_GrantTotal,
          photos: listing.photos as string[],
          '{PYear}': listing.L_YearBuilt || ' ',
          loved: loved_items && loved_items.includes(listing.MLS_ID),
          onLoveItem: (remove: boolean) => {
            if (agent) {
              evt.fireEvent(
                {
                  ...listing,
                  love: love || 0,
                },
                agent,
                remove,
              );
            }
          },
        }}
      >
        {children}
      </RxComponentChomper>
    </div>
  );
}
