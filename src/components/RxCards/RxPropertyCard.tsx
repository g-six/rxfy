import React, { ReactElement, cloneElement } from 'react';
import { Events } from '@/_typings/events';
import { PropertyDataModel } from '@/_typings/property';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import useLove from '@/hooks/useLove';

import styles from './RxPropertyCard.module.scss';
import Cookies from 'js-cookie';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { formatAddress } from '@/_utilities/string-helper';
import axios from 'axios';

export function isEmptyHeart(props: { className: string; 'data-field': string }) {
  return props.className?.indexOf('heart-full') >= 0 || props['data-field'] === 'heart_empty';
}
export function isFullHeart(props: { className: string; 'data-field': string }) {
  return props.className?.indexOf('heart-full') >= 0 || props['data-field'] === 'heart_full';
}

function RxComponentChomper({ config, children }: any): any {
  const cloneChildren = React.Children.map(children, child => {
    if (typeof child === 'string') {
      return config[child] || child;
    } else if (React.isValidElement(child)) {
      const RxElement = child as React.ReactElement;
      if (RxElement.props.className && (isFullHeart(RxElement.props) || isEmptyHeart(RxElement.props))) {
        if (config['view-only']) return <></>;
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
            opacity_class = 'opacity-0 group-hover:opacity-0 group-hover:block sm:hidden';
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
      } else if (RxElement.props?.['data-field']) {
        let field = RxElement.props['data-field'];
        if (field.includes('address')) field = 'title';
        if (field === 'cover_photo') {
          if (RxElement.type === 'img')
            return config.cover_photo
              ? cloneElement(RxElement, {
                  src: config.cover_photo,
                })
              : RxElement;
          else
            return cloneElement(
              RxElement,
              config.cover_photo
                ? {
                    style: {
                      backgroundImage: `url(${config.cover_photo})`,
                    },
                  }
                : {},
              RxComponentChomper({
                config,
                children: (RxElement.props.children as ReactElement[]).filter(r => r.type !== 'img'),
              }) as any,
            );
        }
        return cloneElement(RxElement, {}, formatValues(config.listing, field));
      } else if (RxElement.props.className?.includes('propcard-details') || RxElement.props.className?.includes('is-card')) {
        if (config.onClickItem)
          return React.cloneElement(RxElement, {
            ...RxElement.props,
            className: [RxElement.props.className, 'cursor-pointer'].join(' ').trim(),
            onClick: () => {
              config.onClickItem();
            },
            children: RxComponentChomper({
              config,
              children: RxElement.props.children,
            }) as any,
          });
      } else if (RxElement.props.className === 'loading-animation') {
        return React.cloneElement(child, {
          ...RxElement.props,
          className: RxElement.props.className,
          children: config.is_loading ? (
            <svg className='animate-spin -ml-1 mr-3 h-12 w-12 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
              <circle className='opacity-50' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
              <path
                className='opacity-100 text-indigo-600'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
          ) : (
            <></>
          ),
        });
      } else if (child.type !== 'img') {
        //heart-full
        if (RxElement.props.className && RxElement.props.className.indexOf('propcard-image') === 0) {
          return React.cloneElement(child, {
            ...RxElement.props,
            className: [RxElement.props.className, config.onClickItem ? 'cursor-pointer' : ''].join(' ').trim(),
            style: config.cover_photo
              ? {
                  backgroundImage: `url(${getImageSized(config.cover_photo, 540)})`,
                }
              : {},
            onClick: () => {
              if (config.onClickItem) {
                config.onClickItem();
              }
            },
            children: RxComponentChomper({
              config,
              children: RxElement.props.children,
            }) as any,
          });
        }
      } else if (child.type === 'img' && RxElement.props?.className?.includes('propcard-image')) {
        return cloneElement(child as ReactElement, {
          src: getImageSized(config.cover_photo, 800),
          srcSet: undefined,
          sizes: undefined,
          loading: undefined,
          className: classNames(RxElement.props.className, config.is_loading ? 'cursor-progress' : 'cursor-pointer'),
        });
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
  ...props
}: {
  love?: number;
  agent?: number;
  sequence?: number;
  children: any;
  listing: PropertyDataModel;
  isLink?: boolean;
  'view-only'?: boolean;
  onClick?: () => void | undefined;
}) {
  const url = new URL(location.href);
  // e.g /agent-id/profile-slug/map
  const segments = url.pathname.split('/');
  // e.g. map
  segments.pop();
  const [is_loading, toggleLoading] = React.useState(false);
  const [loved_items, setLovedItems] = React.useState(getData(Events.LovedItem) as unknown as string[]);
  const evt = useLove();
  let address = listing.title && formatAddress(`${listing.title}${listing.city ? `, ${listing.city}` : ''}`);

  if (listing.state_province) {
    address = `${address} ${listing.state_province}`;
  }
  if (listing.postal_zip_code) {
    address = `${address} ${listing.postal_zip_code}`;
  }

  React.useEffect(() => {
    if (evt.data?.item && evt.data.item.mls_id === listing.mls_id) {
      setLovedItems(getData(Events.LovedItem) as unknown as string[]);
    }
  }, [evt.data]);

  return (
    <div
      data-agent={agent}
      data-mls-id={listing.mls_id}
      className={classNames(
        props['view-only'] ? '' : 'group relative',
        sequence === 0 ? `` : 'hidden sm:block',
        Cookies.get('session_key') && listing.status?.toLowerCase() === 'sold' ? styles.ShowSold : '',
      )}
    >
      <RxComponentChomper
        config={{
          is_loading,
          '{PropCard Address}': address,
          '{PropertyCard Address}': address,
          '{PropertyCard Price}': formatValues(listing, 'asking_price'),
          '{PArea}': listing.area || listing.city || 'N/A',
          '{PBd}': listing.beds || 1,
          '{PBth}': listing.baths,
          '{Psq}': listing?.floor_area_total ? formatValues(listing, 'floor_area_total') : formatValues(listing, 'floor_area'),
          photos: listing.photos as string[],
          cover_photo: listing.cover_photo as string,
          '{PYear}': listing.year_built || ' ',
          loved: loved_items && loved_items.includes(listing.mls_id),
          listing,
          'view-only': props['view-only'],
          onClickItem: () => {
            toggleLoading(true);
            if (props.onClick) {
              props.onClick();
            } else if (isLink) {
              axios
                .get(`/api/properties/mls-id/${listing.mls_id}`)
                .then(r => {
                  // Fix the application error for properties not imported yet
                  location.href = `${segments.join('/')}/property?mls=${listing.mls_id}`;
                })
                .catch(console.error);
            }
          },
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
