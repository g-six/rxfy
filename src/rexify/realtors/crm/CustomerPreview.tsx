'use client';
import React from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
import { CustomerRecord } from '@/_typings/customer';
import { getShortPrice } from '@/_utilities/data-helpers/price-helper';
import { RxButton } from '@/components/RxButton';
import RxCustomerNotesWrapper from './CustomerNotesWrapper';
import styles from './CustomerNotes.module.scss';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import { AgentData } from '@/_typings/agent';

type Props = {
  children: React.ReactElement;
  className?: string;
  'data-customer': CustomerRecord;
  'data-session'?: AgentData;
};

function Iterator(p: Props) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.children) {
      if (child.props?.['event-name'] === 'view-client') {
        return React.cloneElement(child, {
          href: `${child.props.href}?customer=${p['data-customer'].agent_customer_id}`,
          onClick: () => {
            const { agent_id, metatags } = (p['data-session'] || {}) as unknown as {
              agent_id?: string;
              metatags?: {
                profile_slug: string;
              };
            };
            setData(
              'viewing_customer',
              JSON.stringify({
                ...(p['data-customer'] || {}),
                agent_id,
                profile_slug: metatags?.profile_slug || '',
              }),
            );
          },
        });
      } else if (child.props?.['data-field']) {
        let dwelling_type = '';
        let price_range = '';
        if (p['data-customer'] && p['data-customer'].saved_searches) {
          const [criteria] = p['data-customer'].saved_searches as unknown as {
            city: string;
            dwelling_types: string[];
            minprice: number;
            maxprice: number;
          }[];
          if (criteria) {
            if (criteria.minprice && criteria.maxprice) {
              price_range = `${getShortPrice(criteria.minprice)} - ${getShortPrice(criteria.maxprice)}`;
            } else if (criteria.maxprice) {
              price_range = `max. ${criteria.maxprice}`;
            } else if (criteria.minprice) {
              price_range = `min. ${criteria.minprice}`;
            }
            dwelling_type = [criteria.city || '', criteria.dwelling_types[0] || ''].join(' ').trim();
          }
        }
        switch (child.props['data-field']) {
          case 'location_and_type':
            return React.cloneElement(child, {
              children: dwelling_type || 'N/A',
            });
          case 'price_range':
            return React.cloneElement(child, {
              children: price_range || 'N/A',
            });
          case 'last_activity_at':
            return React.cloneElement(child, {
              children:
                (p['data-customer'] &&
                  p['data-customer'].last_activity_at &&
                  new Intl.DateTimeFormat().format(new Date(p['data-customer'].last_activity_at))) ||
                'N/A',
            });
          case 'full_name':
            return React.cloneElement(child, {
              children: (p['data-customer'] && p['data-customer'].full_name) || 'No Name',
            });
          case 'birthday':
            let bday;
            if (p['data-customer'] && p['data-customer'].birthday) {
              const [y, m, d] = p['data-customer'].birthday.split('-').map(Number);
              if (y && m && d) {
                bday = new Date(y, m - 1, d);
              }
            }
            return React.cloneElement(child, {
              children: (bday && new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long' }).format(bday)) || 'N/A',
            });
          case 'phone_number':
            return React.cloneElement(<a href={`tel:${p['data-customer']?.phone_number}`} />, {
              children: (p['data-customer'] && p['data-customer'].phone_number) || 'Not Available',
            });
          case 'sms_number':
            return React.cloneElement(<a href={`sms:${p['data-customer']?.phone_number}`} />, {
              children: (p['data-customer'] && p['data-customer'].phone_number) || 'Not Available',
            });
          case 'email':
            return React.cloneElement(<a href={`mailto:${p['data-customer']?.email}`} />, {
              children: (p['data-customer'] && p['data-customer'].email) || 'Not Available',
            });
          default:
            return child;
        }
      } else if (child.props.children === 'Add a Note') {
        return (
          <RxButton
            className={child.props.className}
            rx-event={Events.AddCustomerNote}
            id={`${Events.AddCustomerNote}-trigger`}
            disabled={!p['data-customer']?.id}
          >
            {child.props.children}
          </RxButton>
        );
      } else if (child.props.className?.indexOf('all-notes') >= 0) {
        const { children: card_children, className: card_class } = child.props.children[0].props;
        return (
          <RxCustomerNotesWrapper className={child.props.className} notes={p['data-customer'].notes}>
            <div className={card_class}>{card_children}</div>
          </RxCustomerNotesWrapper>
        );
      } else if (child.type !== 'div') {
        return child;
      }
      return (
        <div {...child.props}>
          <Iterator {...child.props} data-customer={p['data-customer']} data-session={p['data-session']}>
            {child.props.children}
          </Iterator>
        </div>
      );
    } else {
      return child;
    }
  });
  return <>{Wrapped}</>;
}

export default function RxCRMCustomerPreview(p: Props) {
  const formToggle = useEvent(Events.CreateCustomerForm);
  const { active: new_form_active } = formToggle.data as unknown as {
    active: boolean;
  };
  const evt = useEvent(Events.SelectCustomerCard);
  const [customer, setCustomer] = React.useState<CustomerRecord>();

  const { active } = evt.data as unknown as {
    active: number;
  };

  const { data } = useEvent(Events.LoadUserSession);
  const { customers } = data as unknown as {
    customers: CustomerRecord[];
  };

  React.useEffect(() => {
    if (active && data) {
      const [record] = active ? customers?.filter(customer => customer.agent_customer_id === active) : [];
      if (record) setCustomer(record);
    }
  }, [data, active]);

  React.useEffect(() => {
    if (active) {
      const [record] = active ? customers?.filter(customer => customer.agent_customer_id === active) : [];
      if (record) setCustomer(record);
    }
  }, [active]);

  React.useEffect(() => {
    const [record] = active ? customers?.filter(customer => customer.agent_customer_id === active) : [];
    if (record) setCustomer(record);
  }, []);

  return (
    <section
      className={['RxCRMCustomerPreview', p.className || '', customer !== undefined && !new_form_active ? '' : styles['hidden-component']].join(' ').trim()}
    >
      {customer !== undefined && (
        <Iterator data-customer={customer} data-session={data}>
          {p.children}
        </Iterator>
      )}
    </section>
  );
}
