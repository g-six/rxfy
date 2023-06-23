'use client';
import React from 'react';
import styles from './CustomerNotes.module.scss';
import { Transition } from '@headlessui/react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { RxButton } from '@/components/RxButton';
import { addCustomerNote, updateCustomerNote } from '@/_utilities/api-calls/call-realtor';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import Cookies from 'js-cookie';
import { AxiosError } from 'axios';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';

type Props = {
  className?: string;
  children: React.ReactElement;
  'rx-event': Events;
  'data-id'?: number;
  'data-body'?: string;
  onClose?: () => void;
  onChange?: (evt: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function Iterator(p: Props) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.children) {
      if (child.props.children === 'Save') {
        return (
          <RxButton className={child.props.className} rx-event={Events.SaveCustomerNote} id={`${Events.SaveCustomerNote}-trigger`}>
            {child.props.children}
          </RxButton>
        );
      } else if (child.props.children === 'Cancel') {
        return (
          <button type='reset' className={child.props.className} onClick={p.onClose}>
            {child.props.children}
          </button>
        );
      } else if (child.props.className?.indexOf('close-link') >= 0) {
        return React.cloneElement(<div />, {
          ...child.props,
          className: [child.props.className || '', styles['close-button']].join(' ').trim(),
          href: undefined,
          onClick: p.onClose,
        });
      } else if (child.type !== 'div' && child.type !== 'a' && child.type !== 'form') {
        return child;
      }
      return (
        <div {...child.props} data-id={p['data-id']}>
          <Iterator {...child.props} rx-event={p['rx-event']} data-id={p['data-id']} data-body={p['data-body']} onChange={p.onChange} onClose={p.onClose}>
            {child.props.children}
          </Iterator>
        </div>
      );
    } else {
      if (child.type === 'textarea') {
        return React.cloneElement(child, {
          ...child.props,
          onChange: p.onChange,
          defaultValue: p['data-body'],
        });
      }
      return child;
    }
  });
  return <>{Wrapped}</>;
}

export default function RxCRMNotes(p: Props) {
  const session = useEvent(Events.LoadUserSession);
  const evt = useEvent(p['rx-event']);
  const saveHandler = useEvent(Events.SaveCustomerNote);
  const { data: chosen } = useEvent(Events.SelectCustomerCard);
  const { active } = chosen as unknown as {
    active: number;
  };
  const { id: notes_id, body } = evt.data as unknown as {
    id: number;
    body: string;
  };
  React.useEffect(() => {
    if (saveHandler.data?.clicked) {
      const { notes } = saveHandler.data as unknown as {
        notes: string;
      };
      if (notes && (active || notes_id) && evt.data?.clicked) {
        const id = notes_id || active;
        let fn = addCustomerNote;
        if (notes_id) fn = updateCustomerNote;

        fn(id, notes)
          .then(console.log)
          .catch(console.error)
          .finally(() => {
            saveHandler.fireEvent({});
            evt.fireEvent({});
            getUserBySessionKey(Cookies.get('session_key') as string, 'realtor')
              .then(data => {
                session.fireEvent(data);
              })
              .catch(e => {
                const axerr = e as AxiosError;
                if (axerr.response?.status === 401) {
                  clearSessionCookies();
                  setTimeout(() => {
                    location.href = '/log-in';
                  }, 500);
                }
              });
          });
      } else {
        saveHandler.fireEvent({});
        evt.fireEvent({});
      }
    }
  }, [saveHandler]);

  return (
    <Transition
      key='confirmation'
      show={evt.data?.clicked === `${p['rx-event']}-trigger`}
      enter='transform ease-out duration-300 transition top-0'
      enterFrom='opacity-0'
      enterTo='opacity-100'
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
      as='div'
      className={p.className + ` customer-${active} ` + styles.Modal}
    >
      <Iterator
        rx-event={p['rx-event']}
        data-id={active}
        data-body={body || ''}
        onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
          saveHandler.fireEvent({
            notes: evt.currentTarget.value,
          } as unknown as EventsData);
        }}
        onClose={() => {
          evt.fireEvent({
            clicked: undefined,
          });
        }}
      >
        {p.children}
      </Iterator>
    </Transition>
  );
}
