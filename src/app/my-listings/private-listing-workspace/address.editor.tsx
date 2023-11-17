'use client';

import { Children, ReactElement, cloneElement } from 'react';
import { AgentData } from '@/_typings/agent';
import { PrivateListingModel } from '@/_typings/private-listing';
import MyListingsAddressInputComponent from './components/address-input.component';
import MyListingStreetMap from './components/street-map.component';
import MyListingStreetView from './components/street-view.component';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';

function Rexify({
  children,
  ...attributes
}: {
  agent: AgentData;
  listing?: PrivateListingModel;
  children: ReactElement;
  disabled?: boolean;
  onAction(action: string): void;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { children: components, className = '', 'data-action': action, ...props } = c.props;
      className = `${className}${className && ' '}rexified`;

      if (action)
        return (
          <button
            className={c.props.className}
            disabled={attributes.disabled}
            onClick={() => {
              attributes.onAction(action);
            }}
          >
            {attributes.disabled && <SpinningDots className='fill-white w-6 h-6 text-white mr-2' />}
            {c.props.children}
          </button>
        );
      if (components && typeof components !== 'string') {
        // Rexify workspace tabs
        if (attributes.listing?.id) {
          if (className.includes('get-started')) {
            return <></>;
          }
          if (attributes.listing?.lat && attributes.listing?.lon) {
            if (className.includes('tab-neighborhood-content'))
              return cloneElement(
                c,
                {
                  className,
                },

                <MyListingStreetMap lat={Number(attributes.listing.lat)} lon={Number(attributes.listing.lon)} />,
              );
            if (className.includes('tab-street-content')) {
              return cloneElement(
                c,
                {
                  className,
                },
                <MyListingStreetView lat={Number(attributes.listing.lat)} lon={Number(attributes.listing.lon)}>
                  {components}
                </MyListingStreetView>,
              );
            }
          }
        }
        return cloneElement(c, { className }, <Rexify {...attributes}>{components}</Rexify>);
      }

      if (c.type === 'input') {
        const address = attributes.listing?.title || '';

        if (className.includes('address-input')) return <MyListingsAddressInputComponent {...props} className={className} address={address} />;
        if (props['data-name']) {
          switch (props['data-name']) {
            case 'Address':
              return cloneElement(c, { defaultValue: attributes.listing?.title || '' });
            case 'Unit':
              return cloneElement(c, { defaultValue: attributes.listing?.building_unit || '' });
            case 'City':
              return cloneElement(c, { defaultValue: attributes.listing?.city || '' });
            case 'Province':
              return cloneElement(c, { defaultValue: attributes.listing?.state_province || '' });
            case 'Postal Code':
              return cloneElement(c, { defaultValue: attributes.listing?.postal_zip_code || '' });
            case 'Neighbourhood':
              return cloneElement(c, { defaultValue: attributes.listing?.neighbourhood || '' });
          }
        }
      }
    }

    return c;
  });
  return <>{Rexified}</>;
}
export default function MyListingsAddressEditor({ children, ...data }: { agent: AgentData; listing?: PrivateListingModel; children: ReactElement }) {
  const form = useFormEvent<PrivateListingData>(Events.PrivateListingForm);

  function proceed() {
    console.log(data.listing);
  }
  return (
    <Rexify
      {...data}
      onAction={(action: string) => {
        if (action === 'next') {
          proceed();
        }
      }}
    >
      {children}
    </Rexify>
  );
}
