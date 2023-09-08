'use client';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { sendInfoRequest } from '@/_utilities/api-calls/call-properties';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { ReactElement } from 'react';
import { PageData } from './type.definition';

interface PageActionProps {
  children: ReactElement;
  data: PageData;
  className?: string;
  'data-action': string;
}
export default function PageAction({ children, ...props }: PageActionProps) {
  const evt = useEvent(Events.GenericAction);
  let onClick = () => {
    console.log('No button handler for this action');
  };
  switch (props['data-action']) {
    case 'request_info':
      onClick = () => {
        console.log(props.data.title, props.data.style_type);
        evt.fireEvent({ show: true });
        // sendInfoRequest(property)
      };
      break;
  }
  return (
    <button {...props} onClick={onClick}>
      {convertDivsToSpans(children)}
    </button>
  );
}
