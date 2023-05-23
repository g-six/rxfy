import React from 'react';
import { Events } from '@/_typings/events';
import { PropertyDataModel } from '@/_typings/property';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { classNames } from '@/_utilities/html-helper';
import useLove from '@/hooks/useLove';

import styles from './RxPropertyCard.module.scss';
import Cookies from 'js-cookie';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { getMLSProperty } from '@/_utilities/api-calls/call-properties';

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
            style:
              config.photos && config.photos.length > 0
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

export default function RxPropertyCardV2({
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
  listing: PropertyDataModel;
  isLink?: boolean;
}) {
  const [is_loading, toggleLoading] = React.useState(false);
  const [loved_items, setLovedItems] = React.useState(getData(Events.LovedItem) as unknown as string[]);
  const evt = useLove();

  React.useEffect(() => {
    if (evt.data?.item && evt.data.item.mls_id === listing.mls_id) {
      setLovedItems(getData(Events.LovedItem) as unknown as string[]);
    }
  }, [evt.data]);

  return (
    <div
      data-agent={agent}
      className={classNames(
        'group relative',
        sequence === 0 ? `` : 'hidden sm:block',
        Cookies.get('session_key') && listing.status?.toLowerCase() === 'sold' ? styles.ShowSold : '',
      )}
    >
      <RxComponentChomper
        config={{
          is_loading,
          '{PropCard Address}': listing.title,
          '{PropertyCard Address}': listing.title,
          '{PropertyCard Price}': new Intl.NumberFormat().format(listing.asking_price),
          '{PArea}': listing.area || listing.city || 'N/A',
          '{PBd}': listing.beds || 1,
          '{PBth}': listing.baths || 'N/A',
          '{Psq}': listing.floor_area,
          photos: listing.photos as string[],
          '{PYear}': listing.year_built || ' ',
          loved: loved_items && loved_items.includes(listing.mls_id),
          onClickItem: () => {
            if (isLink) {
              toggleLoading(true);
              getMLSProperty(listing.mls_id).then(() => {
                // Fix the application error for properties not imported yet
                location.href = `/property?mls=${listing.mls_id}`;
              });
            }
          },
          onLoveItem: (remove: boolean) => {
            if (agent) {
              evt.fireEvent(
                {
                  ...(listing as any),
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
      <div role='status' className={`${isLink && is_loading ? '' : 'hidden '}absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}>
        <svg
          aria-hidden='true'
          className='inline w-12 h-12 mr-2 text-gray-200 animate-spin fill-slate-800/50'
          viewBox='0 0 100 101'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
            fill='currentColor'
          />
          <path
            d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
            fill='currentFill'
          />
        </svg>
        <span className='sr-only'>Loading...</span>
      </div>
    </div>
  );
}
