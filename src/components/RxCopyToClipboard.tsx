'use client';
import React from 'react';
import useEvent from '@/hooks/useEvent';
import { Events, NotificationCategory, NotificationMessages } from '@/_typings/events';

type Props = {
  className: string;
  children?: React.ReactElement;
};
export default function RxCopyToClipboard(p: Props) {
  const { fireEvent } = useEvent(Events.SystemNotification);
  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      fireEvent({
        category: NotificationCategory.SUCCESS,
        message: `This page's URL was copied to clipboard`,
        timeout: 4000,
      });
    } catch (err) {
      fireEvent({
        category: NotificationCategory.ERROR,
        message: 'Sorry but your browser does not support copying and sharing URLs, please copy the URL from the address bar to share instead.',
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
