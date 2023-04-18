'use client';
import React from 'react';
import useEvent from '@/hooks/useEvent';
import { Events, NotificationCategory, NotificationMessages } from '@/_typings/events';

type Props = {
  className: string;
  children?: React.ReactElement;
  title: string;
};
export default function RxShareButton(p: Props) {
  const { fireEvent } = useEvent(Events.SystemNotification);
  const copyLinkToClipboard = async () => {
    try {
      await navigator.share({
        title: p.title,
        text: p.title,
        url: location.href,
      });
    } catch (err) {
      fireEvent({
        category: NotificationCategory.ERROR,
        message: 'Sorry but your browser does not support sharing URLs, please copy the URL from the address bar to share instead.',
        timeout: 4000,
      });
    }
  };
  return (
    <button
      className={p.className}
      onClick={() => {
        copyLinkToClipboard();
      }}
    >
      {p.children || ' '}
    </button>
  );
}
