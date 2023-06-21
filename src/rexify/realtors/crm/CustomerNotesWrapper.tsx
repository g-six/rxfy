'use client';
import { CustomerRecord } from '@/_typings/customer';
import useEvent, { Events } from '@/hooks/useEvent';
import React from 'react';
import RxCRMCustomerNoteCard from './CustomerNoteCard';

type Props = {
  className: string;
  children: React.ReactElement;
};
export default function RxCustomerNotesWrapper(p: Props) {
  const session = useEvent(Events.LoadUserSession);
  const evt = useEvent(Events.SelectCustomerCard);
  const { active: customer_id } = evt.data as unknown as {
    active: number;
  };
  const { customers } = session.data as unknown as {
    customers: CustomerRecord[];
  };
  const [customer] = customers ? customers.filter(c => c.id === customer_id) : [];
  const { notes } = customer || {};

  const cards = (notes &&
    notes.map(n => {
      return (
        <RxCRMCustomerNoteCard key={n.id} className={p.children.props.className} data-body={n.body} data-id={n.id} data-created-at={new Date(n.created_at)}>
          {p.children.props.children}
        </RxCRMCustomerNoteCard>
      );
    })) || <></>;
  return <section className={p.className}>{cards}</section>;
}
