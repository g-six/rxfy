import { Events } from '@/_typings/events';
import { MLSProperty } from '@/_typings/property';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import useLove from '@/hooks/useLove';
import React from 'react';

function RxComponentChomper({ config, children }: any): any {
  const cloneChildren = React.Children.map(children, child => {
    if (typeof child === 'string') {
      return config[child] || child;
    } else if (React.isValidElement(child)) {
      const RxElement = child as React.ReactElement;
      if (RxElement.props.className && (RxElement.props.className.indexOf('heart-full') >= 0 || RxElement.props.className.indexOf('heart-empty') >= 0)) {
        let opacity_class = 'opacity-0 group-hover:opacity-100';
        let onClick = () => {};
        if (RxElement.props.className.indexOf('heart-full') >= 0) {
          if (config.loved) {
            opacity_class = 'opacity-100';
            onClick = () => {
              config.onLoveItem(true);
            };
          } else {
            opacity_class = 'opacity-100 group-hover:opacity-0 group-hover:block hidden';
            onClick = () => {
              config.onLoveItem();
            };
          }
        }
        if (RxElement.props.className.indexOf('heart-empty') >= 0) {
          if (!config.loved) {
            opacity_class = 'opacity-0 group-hover:opacity-100 group-hover:block hidden';
          }
          onClick = () => {
            console.log('removeeee');
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
      } else if (child.type !== 'img') {
        //heart-full
        if (RxElement.props.className === 'propcard-image') {
          RxElement.props.style = {
            backgroundImage: config.photos ? `url(${(config.photos as string[])[0]})` : 'none',
          };

          return React.cloneElement(child, {
            ...RxElement.props,
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
    // console.log('skipped', child, typeof child);
    return child;
  });

  return <>{cloneChildren}</>;
}

export default function RxPropertyCard({ sequence, children, listing, agent }: { agent?: number; sequence?: number; children: any; listing: MLSProperty }) {
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
      className={classNames('group absolute ml-1 w-11/12 sm:ml-4 md:w-full md:ml-auto md:relative', sequence === 0 ? `` : 'hidden sm:block')}
    >
      <RxComponentChomper
        config={{
          '{PropCard Address}': listing.Address,
          '{PropertyCard Address}': listing.Address,
          '{PropertyCard Price}': formatValues(listing, 'AskingPrice'),
          '{PArea}': listing.Area || listing.City || 'N/A',
          '{PBd}': listing.L_BedroomTotal || 1,
          '{PBth}': listing.L_TotalBaths,
          '{Psq}': listing.L_FloorArea_Total,
          photos: listing.photos as string[],
          '{PYear}': listing.L_YearBuilt || ' ',
          loved: loved_items && loved_items.includes(listing.MLS_ID),
          onLoveItem: (remove: boolean) => {
            if (agent) {
              evt.fireEvent(listing, agent, remove);
            }
          },
        }}
      >
        {children}
      </RxComponentChomper>
      <a href={`/property?mls=${listing.MLS_ID}`} className='absolute top-0 left-0 w-full h-full'>
        {' '}
      </a>
    </div>
  );
}
