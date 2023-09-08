'use client';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import useEvent, { Events } from '@/hooks/useEvent';
import { ReactElement } from 'react';

interface PageActionProps {
  children: ReactElement;
  className?: string;
  'data-action': string;
}
export default function PageAction({ children, ...props }: PageActionProps) {
  let onClick = () => {
    console.log('No button handler for this action');
  };
  switch (props['data-action']) {
    case 'request_info':
  }
  return <button {...props}>{convertDivsToSpans(children)}</button>;
}
