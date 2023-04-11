'use client';
import React, { useState } from 'react';

import useEvent, { Events } from '@/hooks/useEvent';
import { ReplacerPageProps } from '@/_typings/forms';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/findElements';

export default function RxContactForm({ nodes, agent, nodeProps, nodeClassName }: ReplacerPageProps) {
  const eventShow = useEvent(Events.ContactFormShow);
  const [show, setShow] = useState(false);

  React.useEffect(() => {
    if (eventShow?.data && Object.keys(eventShow.data).length) {
      setShow(!!eventShow.data.show);
    }
  }, [eventShow]);

  const matches = [
    {
      searchFn: searchByClasses(['contact-form-close']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          onClick: () => eventShow.fireEvent({ show: false }),
        }),
    },
    {
      searchFn: searchByClasses(['send-message-button']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          onClick: () => eventShow.fireEvent({ show: false }),
        }),
    },
  ];

  const style = Object.assign({}, nodeProps.style, { display: 'inherit' });

  return !show ? (
    <></>
  ) : (
    <div className={nodeClassName} style={style}>
      {transformMatchingElements(nodes, matches)}
    </div>
  );
}
