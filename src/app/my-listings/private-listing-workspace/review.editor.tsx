'use client';

import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { AgentData, Property } from '@/_typings/agent';
import { PrivateListingModel } from '@/_typings/private-listing';
import MyListingsAddressInputComponent from './components/address-input.component';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';

function Rexify({
  children,
  ...attributes
}: {
  agent: AgentData;
  listing?: PrivateListingModel;
  'preview-html'?: string;
  children: ReactElement;
  disabled?: boolean;
  onAction(action: string): void;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { children: components, className = '', 'data-action': action, ...props } = c.props;
      className = `${className}${className && ' '}rexified`;
      if (attributes.listing?.id && props.id && props.id === 'preview-private-listing')
        return (
          <iframe
            className='h-screen w-screen scale-75 -translate-x-[10rem] -translate-y-[5rem]'
            src={`https://${
              attributes.agent.domain_name || `leagent.com/${attributes.agent.agent_id}/${attributes.agent.metatags.profile_slug}`
            }/property?lid=${attributes.listing.id}`}
          />
        );

      //   return (
      //     <PropertyPageIterator photos={[]} agent={attributes.agent} property={attributes.listing as unknown as PageData}>
      // </PropertyPageIterator>
      //   );
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
            {c.props.children || c.props.value}
          </button>
        );
      if (components && typeof components !== 'string') {
        // Rexify workspace tabs
        if (attributes.listing?.id) {
        }
        return cloneElement(c, { className }, <Rexify {...attributes}>{components}</Rexify>);
      }

      if (props['data-field'] === 'description') {
        const description = attributes.listing?.description || '';
        return cloneElement(c, { className, defaultValue: description });

        if (className.includes('address-input')) return <MyListingsAddressInputComponent {...props} className={className} address={address} />;
      }
    }

    return c;
  });
  return <>{Rexified}</>;
}
export default function MyListingsReviewEditor({
  children,
  ...data
}: {
  agent: AgentData;
  listing?: PrivateListingModel;
  children: ReactElement;
  'preview-html'?: string;
}) {
  const form = useFormEvent<PrivateListingData>(Events.PrivateListingForm);
  const [property, setProperty] = useState<PrivateListingModel>();

  let { listing, ...attribs } = data;

  function proceed() {
    console.log(data.listing);
  }

  useEffect(() => {
    if (form.data) {
      const { reload } = form.data as unknown as { reload?: boolean };
      if (reload) {
        setProperty(property);
      }
    }
  }, [form]);

  useEffect(() => {
    if (listing) setProperty(listing as unknown as PrivateListingModel);
  }, []);

  return (
    <Rexify
      {...attribs}
      listing={property}
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
