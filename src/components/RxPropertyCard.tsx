import { MLSProperty } from '@/_typings/property';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import React from 'react';

const ReplaceTextComponent = ({ config, children }) => {
  const cloneChildren = React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return config[child] || child;
    } else if (
      React.isValidElement(child) &&
      child.type !== 'img'
    ) {
      if (child.props.className === 'propcard-image') {
        return React.cloneElement(child, {
          style: {
            backgroundImage: config.photos
              ? `url(${config.photos[0]})`
              : 'none',
          },
          children: ReplaceTextComponent({
            config,
            children: child.props.children,
          }),
        });
      }
      return React.cloneElement(child, {
        children: ReplaceTextComponent({
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
    <ReplaceTextComponent
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
    </ReplaceTextComponent>
  );
}
