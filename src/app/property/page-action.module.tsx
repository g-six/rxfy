'use client';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { ReactElement } from 'react';
import { PageData } from './type.definition';

interface PageActionProps {
  children: ReactElement;
  data: PageData;
  className?: string;
  slug: string;
  agent: number;
  'data-action': string;
}
export default function PageAction({ children, data, ...props }: PageActionProps) {
  const evt = useEvent(Events.GenericEvent);
  let onClick = () => {
    console.log('No button handler for this action');
  };
  switch (props['data-action']) {
    case 'request_info':
      onClick = () => {
        const payload = { ...data, show: true } as unknown as EventsData;
        evt.fireEvent(payload);
      };
      break;
    case 'pdf':
      return (
        <a {...props} href={`/api/pdf/mls/${data.mls_id}?agent=${props.agent}&slug=${props.slug}`}>
          {children}
        </a>
      );
  }
  return (
    <button {...props} onClick={onClick}>
      {convertDivsToSpans(children)}
    </button>
  );
}
