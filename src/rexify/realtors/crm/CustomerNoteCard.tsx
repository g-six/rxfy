import React from 'react';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import styles from './CustomerNotes.module.scss';

type Props = {
  children: React.ReactElement;
  className?: string;
  'data-id': number;
  'data-body': string;
  'data-created-at': Date;
};

function Iterator(p: Props) {
  const Wrapped = React.Children.map(p.children, (child, idx) => {
    if (child.props?.children) {
      if (child.props?.['data-field']) {
        switch (child.props['data-field']) {
          case 'body':
            return React.cloneElement(child, {
              ...child.props,
              children: p['data-body'],
              key: idx,
            });
          case 'created_at':
            return React.cloneElement(child, {
              ...child.props,
              children: new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(p['data-created-at'])),
              key: idx,
            });
        }
      } else if (child.type === 'div') {
        return (
          <div className={child.props.className}>
            <Iterator {...p}>{child.props.children}</Iterator>
          </div>
        );
      }
    }
    return React.cloneElement(child, {
      key: idx,
    });
  });
  return <>{Wrapped}</>;
}

export default function RxCRMCustomerNoteCard(p: Props) {
  const evt = useEvent(Events.SelectCustomerCard);
  const editNoteEventHandler = useEvent(Events.EditCustomerNote);

  const { active } = evt.data as unknown as {
    active: number;
  };
  return (
    <div
      className={[styles['note-card'], 'RxCRMCustomerNoteCard', p.className || '', active === p['data-id'] && 'active'].join(' ').trim()}
      onClick={() => {
        editNoteEventHandler.fireEvent({
          id: p['data-id'],
          clicked: `${Events.EditCustomerNote}-trigger`,
          body: p['data-body'],
        } as unknown as EventsData);
      }}
    >
      <Iterator {...p}>{p.children}</Iterator>
    </div>
  );
}
