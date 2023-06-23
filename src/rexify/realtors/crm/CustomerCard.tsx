import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import React from 'react';
import styles from './CustomerNotes.module.scss';
import RxTwCombo from '@/components/RxForms/RxTwCombo';
import { moveClient } from '@/_utilities/api-calls/call-clients';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';

type Props = {
  children: React.ReactElement;
  className?: string;
  'data-id': number;
  'data-full-name': string;
  'data-city': string;
  'data-dwelling-type': string;
  'data-minprice': number;
  'data-maxprice': number;
  notes?: {
    id: number;
    body: string;
    created_at: string;
  }[];
};

function Iterator(p: Props & { onActionClick: (e: React.MouseEvent<HTMLButtonElement>) => void; 'data-dropdown'?: boolean }) {
  const Wrapped = React.Children.map(p.children, (child, idx) => {
    if (child.props?.children) {
      if (child.props?.className) {
        if (child.props.className === 'icon-43 w-embed') {
          return (
            <button
              type='button'
              className={[child.props.className, 'bg-transparent'].join(' ')}
              rx-event={Events.CRMCustomerCardActions}
              id={`${Events.CRMCustomerCardActions}-trigger`}
              onClick={p.onActionClick}
            >
              {child.props.children}
            </button>
          );
        } else if (child.props.className.split(' ').includes('w-dropdown-toggle')) return <></>;
        else if (child.props.className.split(' ').includes('w-dropdown-list'))
          return (
            <RxTwCombo btnClassName={['rexified'].join(' ')} onActionClick={p.onActionClick}>
              {child.props.children}
            </RxTwCombo>
          );

        if (child.props.className.indexOf('crm-name') >= 0)
          return (
            <div key='crm-name' className={`rexified ${child.props.className}`}>
              {p['data-full-name']}
            </div>
          );
        if (child.props.className.indexOf('crm-icon') >= 0) {
          let name = '';
          if (p['data-full-name'])
            name = p['data-full-name']
              .split(' ')
              .map(s => s[0])
              .join('');
          return (
            <div key='crm-icon' className={`rexified ${child.props.className}`}>
              {name}
            </div>
          );
        }
        if (child.props.className.indexOf('crm-address') >= 0) {
          const [dwelling_type] = p['data-dwelling-type'] as unknown as string[];
          return (
            <div key='crm-address' className={`rexified ${child.props.className}`}>
              {p['data-city'] ? p['data-city'] : ''} {dwelling_type || ''}
            </div>
          );
        }
        if (child.props.className.indexOf('crm-price') >= 0)
          return (
            <div key='crm-price' className={`rexified ${child.props.className}`}>
              {p['data-minprice'] ? getShortPrice(p['data-minprice']) : ''} - {p['data-maxprice'] ? getShortPrice(p['data-maxprice']) : ''}
            </div>
          );
        if (child.props.className.indexOf('f-team-detail') >= 0 || child.props.className.indexOf('f-team-avatar') >= 0) {
          return (
            <div {...child.props} key={child.props.className}>
              <Iterator {...p}>{child.props.children}</Iterator>
            </div>
          );
        } else if (child.props.className.split(' ').includes('w-dropdown')) {
          return (
            <div {...child.props} key={child.props.className}>
              <Iterator {...p}>{child.props.children}</Iterator>
            </div>
          );
        }
      }
    }
    return React.cloneElement(child, {
      key: idx,
    });
  });
  return <>{Wrapped}</>;
}

export default function RxCRMCustomerCard(p: Props) {
  const formToggle = useEvent(Events.CreateCustomerForm);
  const session = useEvent(Events.LoadUserSession);
  const evt = useEvent(Events.SelectCustomerCard);
  const addNoteEventHandler = useEvent(Events.AddCustomerNote);
  const dropdown = useEvent(Events.CRMCustomerCardActions);
  const [is_dropped, toggleDropdown] = React.useState(false);

  const { active } = evt.data as unknown as {
    active: number;
  };

  React.useEffect(() => {
    if (dropdown.data?.clicked) {
      console.log(dropdown.data);
      dropdown.fireEvent({});
    }
  }, [dropdown.data]);

  const changeClientStatus = (status: 'lead' | 'active' | 'closed') => {
    moveClient(p['data-id'], status).then(d => {
      if (d.session_key) {
        getUserBySessionKey(d.session_key, 'realtor').then(session.fireEvent);
      }
    });
  };

  return (
    <div
      className={['RxCRMCustomerCard', p.className || '', active === p['data-id'] && 'active', 'pointer-events-auto'].join(' ').trim()}
      onClick={divevt => {
        if (p['data-id']) {
          formToggle.fireEvent({});
          evt.fireEvent({
            active: p['data-id'],
          } as unknown as EventsData);
          addNoteEventHandler.fireEvent({
            relationship_id: p['data-id'],
          } as unknown as EventsData);
        }
      }}
    >
      <Iterator
        {...p}
        data-dropdown={is_dropped}
        onActionClick={e => {
          e.stopPropagation();
          toggleDropdown(true);

          switch (e.currentTarget.textContent) {
            case 'Move to Active':
              changeClientStatus('active');
              break;
            case 'Move to Leads':
              changeClientStatus('lead');
              break;
            case 'Move to Closed':
              changeClientStatus('closed');
              break;
          }
        }}
      >
        {p.children}
      </Iterator>
    </div>
  );
}
