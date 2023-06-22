'use client';
import { CustomerRecord } from '@/_typings/customer';
import useEvent, { Events } from '@/hooks/useEvent';
import React from 'react';
import RxCRMCustomerNoteCard from './CustomerNoteCard';

type Props = {
  className: string;
  children: React.ReactElement;
  notes?: {
    id: number;
    body: string;
    created_at: string;
  }[];
};
export default function RxCustomerNotesWrapper(p: Props) {
  const [notes, setNotes] = React.useState<{ id: number; body: string; created_at: string }[]>();

  React.useEffect(() => {
    setNotes(p.notes);
  }, [p.notes]);

  React.useEffect(() => {
    setNotes(p.notes);
  }, []);

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
