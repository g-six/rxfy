'use client';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { MouseEvent, ReactElement } from 'react';
import { PageData } from './type.definition';
import { loveHome, unloveByMLSId } from '@/_utilities/api-calls/call-love-home';

interface PageActionProps {
  children: ReactElement;
  data: PageData;
  className?: string;
  slug: string;
  agent: number;
  'data-action': string;
}
export default function PageAction({ children, data, ...props }: PageActionProps) {
  const luv = useEvent(Events.LovedItem);
  const evt = useEvent(Events.GenericEvent);

  let onClick = (evt?: MouseEvent<HTMLButtonElement>) => {
    console.log('No button handler for this action');
  };
  switch (props['data-action']) {
    case 'love':
      onClick = evt => {
        evt?.preventDefault();
        // unloveByMLSId(data.mls_id).then(console.log).catch(console.error);
        // loveHome(data.mls_id, props.agent, true).then(console.log).catch(console.error);
        // luv.fireEvent(data, props.agent);
      };
      break;
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
    <button {...props} onClick={onClick} data-property-page-action>
      {convertDivsToSpans(children)}
    </button>
  );
}
