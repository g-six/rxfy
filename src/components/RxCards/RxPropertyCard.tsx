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
        if (RxElement.props.className === 'propcard-image') {
          return React.cloneElement(child, {
            ...RxElement.props,
            className: [RxElement.props.className, config.onClickItem ? 'cursor-pointer' : ''].join(' ').trim(),
            style: config.photos
              ? {
                  backgroundImage: `url(${getImageSized((config.photos as string[])[0], 540)})`,
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
  const [is_loading, toggleLoading] = React.useState(false);
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
          is_loading,
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
          onClickItem: () => {
            if (isLink) {
              toggleLoading(true);
              location.href = `/property?mls=${listing.MLS_ID}`;
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
