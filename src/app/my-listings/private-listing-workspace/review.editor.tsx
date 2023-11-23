'use client';

import { ChangeEvent, Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { AgentData, Property } from '@/_typings/agent';
import { PrivateListingModel } from '@/_typings/private-listing';
import MyListingsAddressInputComponent from './components/address-input.component';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useFormEvent, { Events, NotificationCategory, PrivateListingData } from '@/hooks/useFormEvent';
import { updatePrivateListing } from '@/_utilities/api-calls/call-private-listings';
import useEvent from '@/hooks/useEvent';
import { getAgentBaseUrl } from '@/app/api/_helpers/agent-helper';

function Preview({ url }: { url: string }) {
  const notify = useEvent(Events.SystemNotification);
  const [set_url, setUrl] = useState<string>(url);

  useEffect(() => {
    if (notify.data?.category === NotificationCategory.SUCCESS) {
      setUrl(url + '&ts=' + Date.now());
    }
  }, [notify.data]);

  return <iframe className='h-screen w-screen scale-75 -translate-x-[10rem] -translate-y-[5rem]' src={set_url} />;
}

function Rexify({
  children,
  ...attributes
}: {
  agent: AgentData;
  listing?: PrivateListingModel;
  'preview-html'?: string;
  children: ReactElement;
  disabled?: boolean;
  onChange(value: string): void;
  onAction(action: string): void;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      let { children: components, className = '', 'data-action': action, ...props } = c.props;
      className = `${className}${className && ' '}rexified`;
      if (attributes.listing?.id && props.id && props.id === 'preview-private-listing')
        return (
          <Preview
            url={`https://${
              attributes.agent.domain_name || `leagent.com/${attributes.agent.agent_id}/${attributes.agent.metatags.profile_slug}`
            }/property?lid=${attributes.listing.id}`}
          />
        );

      if (action) {
        if (action === 'view_listing' && attributes.listing?.id) {
          return cloneElement(c, { target: '_blank', href: `${getAgentBaseUrl(attributes.agent, true)}/property?lid=${attributes.listing.id}` });
        }
        return (
          <button
            type='button'
            className={c.props.className}
            data-action={action}
            disabled={attributes.disabled}
            onClick={e => {
              attributes.onAction(action);
            }}
          >
            {attributes.disabled && <SpinningDots className='fill-white w-6 h-6 text-white mr-2' />}
            {c.props.children || c.props.value}
          </button>
        );
      }
      if (components && typeof components !== 'string') {
        // Rexify workspace tabs
        if (attributes.listing?.id) {
        }
        return cloneElement(c, { className }, <Rexify {...attributes}>{components}</Rexify>);
      }

      if (props['data-field'] === 'description') {
        const description = attributes.listing?.description || '';
        return cloneElement(c, {
          className,
          defaultValue: description,
          onChange: (evt: ChangeEvent<HTMLTextAreaElement>) => {
            attributes.onChange(evt.currentTarget.value);
          },
        });
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
  const notification = useEvent(Events.SystemNotification);
  const [property, setProperty] = useState<PrivateListingModel>();

  let { listing, ...attribs } = data;

  function proceed() {
    if (listing?.id && property) {
      updatePrivateListing(listing.id, {
        description: property?.description || '',
      }).then(() => {
        notification.fireEvent({
          message: 'Your listing has been updated!',
          category: NotificationCategory.SUCCESS,
          timeout: 3450,
        });
      });
    }
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
        switch (action) {
          case 'save':
            proceed();
            break;
        }
      }}
      onChange={(description: string) => {
        setProperty({
          ...property,
          description,
        });
      }}
    >
      {children}
    </Rexify>
  );
}
