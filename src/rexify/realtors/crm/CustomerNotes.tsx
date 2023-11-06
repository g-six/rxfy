'use client';
import React, { cloneElement } from 'react';
import styles from './CustomerNotes.module.scss';
import { Transition } from '@headlessui/react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { addCustomerNote, updateCustomerNote } from '@/_utilities/api-calls/call-realtor';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import Cookies from 'js-cookie';
import { AxiosError } from 'axios';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';
import { RxButtonV2 } from '@/components/RxButtonV2';

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
    if (child.props?.value?.toUpperCase() === 'ADD A NOTE') {
      if (p['data-id']) {
        return (
          <RxButtonV2 className={child.props.className} rx-event={Events.SaveCustomerNote} id={`${Events.SaveCustomerNote}-trigger`}>
            <>Update note</>
          </RxButtonV2>
        );
      }
      return (
        <RxButtonV2 className={child.props.className} rx-event={Events.AddCustomerNote} id={`${Events.AddCustomerNote}-trigger`}>
          {child.props.value}
        </RxButtonV2>
      );
    }
    if (child.props?.children) {
      if (child.props.children === 'Save') {
        return (
          <RxButtonV2 className={child.props.className} rx-event={Events.SaveCustomerNote} id={`${Events.SaveCustomerNote}-trigger`}>
            {child.props.children}
          </RxButtonV2>
        );
      } else if (child.props.children === 'New Note' && p['data-id']) {
        return cloneElement(child, {}, <>Update Notes</>);
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
  const { data: active_customer } = useEvent(Events.SelectCustomerCard);
  const { data: note_to_update, fireEvent: toggleCustomerNoteEditor } = useEvent(Events.EditCustomerNote);
  const { active: agent_customer_id } = active_customer as unknown as {
    active: number;
  };
  const { id: existing_notes_id, notes } = saveHandler.data as unknown as {
    notes: string;
    id: number;
  };
  const { id: notes_id, body } = note_to_update as unknown as {
    id: number;
    body: string;
  };

  const closeNoteEditor = () => {
    saveHandler.fireEvent({});
    evt.fireEvent({});
    toggleCustomerNoteEditor({});
  };

  React.useEffect(() => {
    if (evt.data?.clicked && p['rx-event'] === Events.AddCustomerNote) {
      const { agent_customer_id } = (evt.data || {}) as unknown as {
        agent_customer_id?: number;
      };
      if (agent_customer_id && notes) {
        addCustomerNote(agent_customer_id, notes)
          .then(() => {
            getUserBySessionKey(Cookies.get('session_key') as string, 'realtor')
              .then(d => {
                session.fireEvent(d);
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
          })
          .catch(console.error)
          .finally(closeNoteEditor);
      }
    }
  }, [evt.data]);

  React.useEffect(() => {
    if (saveHandler.data?.clicked) {
      if (notes && (agent_customer_id || notes_id)) {
        const id = notes_id || agent_customer_id;
        let fn = addCustomerNote;
        if (notes_id) fn = updateCustomerNote;
        console.log({ agent_customer_id, notes_id });

        fn(id, notes)
          .then(console.log)
          .catch(console.error)
          .finally(() => {
            closeNoteEditor();
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
      show={!!notes_id || !!evt.data?.clicked}
      enter='transform ease-out duration-300 transition top-0'
      enterFrom='opacity-0'
      enterTo='opacity-100'
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
      as='div'
      className={p.className + ` customer-${agent_customer_id} ` + styles.Modal}
    >
      <Iterator
        rx-event={p['rx-event']}
        data-id={notes_id}
        data-body={body || ''}
        onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) => {
          // Every key stroke on the Notes textarea
          saveHandler.fireEvent({
            id: notes_id,
            notes: evt.currentTarget.value,
            clicked: undefined,
          } as unknown as EventsData);
        }}
        onClose={closeNoteEditor}
      >
        {p.children}
      </Iterator>
    </Transition>
  );
}
