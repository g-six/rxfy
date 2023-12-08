'use client';

import { ReactElement, Fragment, Children, cloneElement, useState, SyntheticEvent } from 'react';
import { Transition } from '@headlessui/react';
import { classNames } from '@/_utilities/html-helper';
import useEvent, { Events, EventsData, NotificationCategory } from '@/hooks/useEvent';
import styles from './styles.module.scss';
import { DOMNode, domToReact, htmlToDOM } from 'html-react-parser';
import { sendInfoRequest } from '@/_utilities/api-calls/call-properties';
import { PropertyDataModel } from '@/_typings/property';
import { formatAddress } from '@/_utilities/string-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { sendMessageToRealtor } from '@/_utilities/api-calls/call-realtor';

interface RequestInfoPopupProps {
  children: ReactElement;
  className?: string;
  tag?: string;
  value?: string;
  listing?: PropertyDataModel;
  send_to: {
    email: string;
    name: string;
  };
  show?: boolean;
  'data-action'?: string;
}

function CloseButton({ children, tag, ...p }: RequestInfoPopupProps) {
  const evt = useEvent(Events.GenericEvent);
  const attr = {
    ...p,
    onClick: () => {
      evt.fireEvent({
        ...evt.data,
        message: undefined,
        name: undefined,
        phone: undefined,
        show: false,
      } as unknown as EventsData);
    },
  };
  if (children) return cloneElement(domToReact(htmlToDOM(`<${tag} />`) as DOMNode[]) as ReactElement, attr, children);
  return cloneElement(domToReact(htmlToDOM(`<${tag} />`) as DOMNode[]) as ReactElement, attr);
}

function FormInput({ tag, ...attr }: { tag: string; val?: string; placeholder: string; 'data-input': string; listing: PropertyDataModel }) {
  const { data, fireEvent } = useEvent(Events.GenericEvent);
  let { placeholder } = attr;

  if (attr['data-input'] === 'message' && attr.listing?.title)
    placeholder = `${placeholder} (e.g. I'd like to know more about the ${attr.listing.style_type} at ${formatAddress(attr.listing.title)})`;
  return cloneElement(domToReact(htmlToDOM(`<${tag} data-rx=${attr['data-input']} placeholder="${placeholder}" />`) as DOMNode[]) as ReactElement, {
    ...attr,
    placeholder,
    onChange: (evt: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      fireEvent({
        ...data,
        [attr['data-input']]: evt.currentTarget.value,
      } as unknown as EventsData);
    },
  });
}

function SubmitButton(p: RequestInfoPopupProps) {
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { data, fireEvent: closeModal } = useEvent(Events.GenericEvent);
  const { name: customer_name, phone, message } = data as unknown as { [k: string]: string };
  const [loading, toggleLoading] = useState(false);
  const { children, listing, send_to, show, ...attr } = p;
  return (
    <button
      {...attr}
      type='button'
      disabled={loading}
      onClick={() => {
        if (listing?.title) {
          sendInfoRequest({
            customer_name,
            phone,
            message,
            send_to,
            property_photo: listing.cover_photo ? listing.cover_photo : '',
            property_address: listing.title,
            property_subarea_community: listing.subarea_community || '',
            property_baths: Number(listing.baths),
            property_bedrooms: Number(listing.beds),
            property_price: `$${formatValues(listing, 'asking_price')}`,
            property_space: Number(listing.floor_area),
          })
            .then(() => {
              notify({
                timeout: 8000,
                category: NotificationCategory.SUCCESS,
                message: 'Fantasic! Your message has been sent to ' + send_to.name,
              });
            })
            .finally(() => {
              toggleLoading(false);
              closeModal({ show: false });
            });
        } else {
          sendMessageToRealtor({ send_to, customer_name, phone, message })
            .then(() => {
              notify({
                timeout: 8000,
                category: NotificationCategory.SUCCESS,
                message: 'Fantasic! Your message has been sent to ' + send_to.name,
              });
            })
            .finally(() => {
              toggleLoading(false);
              closeModal({ show: false });
            });
        }
        toggleLoading(true);
      }}
    >
      {loading ? (
        <>
          <svg className='h-6 w-6 animate-spin' viewBox='3 3 18 18'>
            <path
              className='fill-indigo-200'
              d='M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z'
            ></path>
            <path
              className='fill-indigo-800'
              d='M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z'
            ></path>
          </svg>
          <span>Emailing...</span>
        </>
      ) : (
        <>
          {children}
          {attr.value || ''}
        </>
      )}
    </button>
  );
}

function Iterator({ children, ...p }: RequestInfoPopupProps) {
  const Rexified = Children.map(children, c => {
    if (c.props?.['data-action'] === 'close_modal') {
      return (
        <CloseButton {...p} {...c.props} tag={c.type}>
          {c.props.children || ''}
        </CloseButton>
      );
    }
    if (c.props?.['data-action'] === 'submit') {
      return (
        <SubmitButton {...p} {...c.props} tag={c.type}>
          {c.props.children || ''}
        </SubmitButton>
      );
    }
    if (c.props?.['data-input']) {
      return <FormInput {...c.props} listing={p.listing} tag={c.type} />;
    }
    if (c.props?.children && typeof c.props.children !== 'string') {
      const { children: sub, className, ...attr } = c.props;
      return cloneElement(
        c.type === 'form' ? <div /> : c,
        {
          ...attr,
          className: classNames(className || 'no-default-class', `rexified-${c.type}`),
        },
        <Iterator {...p}>{sub}</Iterator>,
      );
    }
    return c;
  });

  return <>{Rexified}</>;
}

export default function RequestInfoPopup({ children, ...p }: RequestInfoPopupProps) {
  const { data } = useEvent(Events.GenericEvent);
  const { show, ...listing } = data || {};
  return (
    <Transition
      key='confirmation'
      show={show || p.show ? true : false}
      as={'section'}
      className={classNames(p.className || '', show ? styles.popup : '')}
      enter='transform ease-out duration-300 transition'
      enterFrom='translate-y-2 opacity-0 sm:translate-y-0'
      enterTo='translate-y-0 opacity-100'
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
    >
      <Iterator {...p} listing={listing as unknown as PropertyDataModel}>
        {children}
      </Iterator>
    </Transition>
  );
}
