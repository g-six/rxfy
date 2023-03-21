import { MLSProperty } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import React from 'react';

function RxComponentChomper({ config, children }: any): any {
  const cloneChildren = React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return config[child] || child;
    } else if (
      React.isValidElement(child) &&
      child.type !== 'img'
    ) {
      if (
        (child as React.ReactElement).props.className ===
        'propcard-image'
      ) {
        (child as React.ReactElement).props.style = {
          backgroundImage: config.photos
            ? `url(${(config.photos as string[])[0]})`
            : 'none',
        };

        return React.cloneElement(child, {
          ...(child as React.ReactElement).props,
          children: RxComponentChomper({
            config,
            children: (child as React.ReactElement).props.children,
          }) as any,
        });
      }

      return React.cloneElement(child, {
        ...(child as React.ReactElement).props,
        children: RxComponentChomper({
          config,
          children: (child as React.ReactElement).props.children,
        }) as any,
      });
    }
    // console.log('skipped', child, typeof child);
    return child;
  });

  return <>{cloneChildren}</>;
}

export default function RxPropertyCard({
  sequence,
  children,
  listing,
}: {
  sequence?: number;
  children: any;
  listing: MLSProperty;
}) {
  return (
    <div
      className={classNames(
        'absolute ml-1 w-11/12 sm:ml-4 md:w-full md:ml-auto md:relative',
        sequence ? `bottom-${sequence * 10}` : ''
      )}
      style={{
        marginBottom: sequence ? `${sequence * 10}px` : '0',
      }}
    >
      <RxComponentChomper
        config={{
          '{PropertyCard Address}': listing.Address,
          '{PropertyCard Price}': formatValues(
            listing,
            'AskingPrice'
          ),
          '{PArea}': listing.Area || listing.City || 'N/A',
          '{PBd}': listing.L_BedroomTotal,
          '{PBth}': listing.L_TotalBaths,
          '{Psq}': listing.L_FloorArea_Total,
          photos: listing.photos as string[],
          '{PYear}': listing.L_YearBuilt || ' ',
        }}
      >
        {children}
      </RxComponentChomper>
      <a href='/' className='absolute top-0 left-0 w-full h-full'>
        {' '}
      </a>
    </div>
  );
}
