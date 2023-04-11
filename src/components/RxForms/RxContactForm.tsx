'use client';
import React, { useState } from 'react';

import useEvent, { Events } from '@/hooks/useEvent';
import { ReplacerPageProps } from '@/_typings/forms';

export default function RxContactForm({ nodes, agent, nodeProps, nodeClassName }: ReplacerPageProps) {
  const eventShow = useEvent(Events.ContactFormShow);
  const eventHide = useEvent(Events.ContactFormHide);

  const [show, setShow] = useState(false);

  React.useEffect(() => {
    console.log('eventShow', eventShow);
    if (eventShow?.data && Object.keys(eventShow.data).length) {
      setShow(!!eventShow.data.show);
    }
  }, [eventShow]);

  return (
    <div className={nodeClassName} style={Object.assign({}, nodeProps.style, { display: show ? 'inherit' : 'none' })}>
      {nodes}
    </div>
  );
}
