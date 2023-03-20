import { MLSProperty } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import React from 'react';

type RxComponentChomperProps = {
  config: Record<string, string | number | string[]>;
  children: any;
};
const RxComponentChomper = ({
  config,
  children,
}: RxComponentChomperProps): React.ReactElement[] => {
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
        return React.cloneElement(child, {
          style: {
            backgroundImage: config.photos
              ? `url(${config.photos[0]})`
              : 'none',
          },
          children: RxComponentChomper({
            config,
            children: child.props.children,
          }),
        });
      }
      return React.cloneElement(child, {
        children: RxComponentChomper({
          config,
          children: child.props.children,
        }),
      });
    }
  });

  return <>{cloneChildren}</>;
};

export default function RxPropertyCard(
  props: MLSProperty & { children: any }
) {
  return (
    <RxComponentChomper
      config={{
        '{PropertyCard Address}': props.Address,
        '{PropertyCard Price}': formatValues(props, 'AskingPrice'),
        '{PArea}': props.Area,
        '{PBd}': props.L_BedroomTotal,
        '{PBth}': props.L_TotalBaths,
        '{Psq}': props.L_FloorArea_Total,
        photos: props.photos as string[],
        '{PYear}': props.L_YearBuilt || ' ',
      }}
    >
      {props.children}
    </RxComponentChomper>
  );
}
