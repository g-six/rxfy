'use client';
import { RealtorInputModel } from '@/_typings/agent';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import Cookies from 'js-cookie';
import { ReactElement, useState } from 'react';

export default function SaveWebsiteUrlButton({ children, ...props }: { children: ReactElement }) {
  const { data, fireEvent } = useEvent(Events.UpdateWebsite);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_loading, toggleLoading] = useState(false);

  return (
    <button
      {...props}
      type='button'
      onClick={() => {
        const session_key = Cookies.get('session_key') as string;
        if (session_key) {
          toggleLoading(true);
          updateAccount(session_key, data as unknown as RealtorInputModel, true).then(() => {
            toggleLoading(false);
            notify({
              timeout: 10000,
              category: NotificationCategory.SUCCESS,
              message: 'Great, your custom URL has been set.\nPlease connect your domain using your DNS provider.',
            });
            fireEvent({});
          });
        }
      }}
    >
      {is_loading ? (
        <>
          <SpinningDots className='fill-white mr-2' /> Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
