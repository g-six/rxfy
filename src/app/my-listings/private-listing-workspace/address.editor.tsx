'use client';

import { ChangeEvent, Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import { PrivateListingModel } from '@/_typings/private-listing';
import MyListingsAddressInputComponent from './components/address-input.component';
import MyListingStreetMap from './components/street-map.component';
import MyListingStreetView from './components/street-view.component';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';

function Rexify({
  children,
  ...attributes
}: {
  agent: AgentData;
  listing?: PrivateListingModel;
  children: ReactElement;
  disabled?: boolean;
  onAction(action: string): void;
  onChange(field: string, value: string): void;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { children: components, className = '', 'data-action': action, ...props } = c.props;
      className = `${className}${className && ' '}rexified`;

      if (action)
        return (
          <button
            data-action={action}
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
              return cloneElement(c, {
                value: attributes.listing?.title || '',
                onChange: (evt: ChangeEvent<HTMLInputElement>) => attributes.onChange('title', evt.currentTarget.value),
              });
            case 'Unit':
              return cloneElement(c, {
                value: attributes.listing?.building_unit || '',
                onChange: (evt: ChangeEvent<HTMLInputElement>) => attributes.onChange('building_unit', evt.currentTarget.value),
              });
            case 'City':
              return cloneElement(c, {
                value: attributes.listing?.city || '',
                onChange: (evt: ChangeEvent<HTMLInputElement>) => attributes.onChange('city', evt.currentTarget.value),
              });
            case 'Province':
              return cloneElement(c, {
                value: attributes.listing?.state_province || '',
                onChange: (evt: ChangeEvent<HTMLInputElement>) => attributes.onChange('state_province', evt.currentTarget.value),
              });
            case 'Postal Code':
              return cloneElement(c, {
                value: attributes.listing?.postal_zip_code || '',
                onChange: (evt: ChangeEvent<HTMLInputElement>) => attributes.onChange('postal_zip_code', evt.currentTarget.value),
              });
            case 'Neighbourhood':
              return cloneElement(c, {
                value: attributes.listing?.neighbourhood || '',
                onChange: (evt: ChangeEvent<HTMLInputElement>) => attributes.onChange('neighbourhood', evt.currentTarget.value),
              });
          }
        }
      }
    }

    return c;
  });
  return <>{Rexified}</>;
}
export default function MyListingsAddressEditor({ children, listing, ...data }: { agent: AgentData; listing?: PrivateListingModel; children: ReactElement }) {
  const form = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const [updates, setUpdates] = useState<{ [k: string]: string }>((listing || {}) as unknown as { [k: string]: string });
  const [is_loading, toggleLoading] = useState<boolean>(false);
  function proceed() {
    if (listing?.id) {
      const { neighbourhood, title, city, state_province, postal_zip_code, building_unit, lat, lon } = updates as unknown as { [k: string]: string };
      updatePrivateListing(listing.id, { neighbourhood, title, city, state_province, postal_zip_code, building_unit, lat, lon })
        .then(() => {
          const next_tab = document.querySelector('a[data-w-tab="Tab 3"]') as HTMLAnchorElement;
          next_tab.click();
        })
        .finally(() => {
          toggleLoading(false);
        });
    }
  }

  useEffect(() => {
    if (form.data) {
      const { address, city, state_province, postal_zip_code, lat, lon } = form.data as unknown as { [k: string]: string };
      setUpdates({
        ...updates,
        address,
        city,
        state_province,
        postal_zip_code,
        lat,
        lon,
        ...(address ? { title: address } : {}),
      });
    }
  }, []);

  return (
    <Rexify
      {...data}
      listing={updates}
      disabled={is_loading}
      onChange={(field, value) => {
        setUpdates({
          ...updates,
          [field]: value,
        });
      }}
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
