import { MLSProperty } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import React from 'react';

function RxComponentChomper({ config, children }: any): any {
  const cloneChildren = React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return config[child] || 'child';
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
  children,
  listing,
}: {
  children: any;
  listing: MLSProperty;
}) {
  return (
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
  );
}
