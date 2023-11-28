'use client';

import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import Cookies from 'js-cookie';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactElement, useEffect, useState } from 'react';

export default function UpdatePasswordButton({ children, ...props }: { children: ReactElement; 'is-realtor'?: boolean }) {
  const query = useSearchParams();
  const path = usePathname();
  const { data, fireEvent } = useEvent(Events.UpdatePassword);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_loading, toggleLoader] = useState<boolean>(true);
  const { className } = props as unknown as {
    [k: string]: string;
  };

  useEffect(() => {
    if (is_loading) {
      const key = query.get('key') || '';
      const { password } = data as unknown as {
        password?: string;
      };
      if (key && password) {
        if (password.length < 7) {
          notify({
            message: 'Please provide a minimum of 8 characters',
            category: NotificationCategory.ERROR,
            timeout: 2200,
          });
        } else {
          updateAccount(
            key,
            {
              password,
            },
            props['is-realtor'],
          )
            .then(results => {
              if (results.error) {
                notify({
                  message: 'The reset password link is no longer valid',
                  category: NotificationCategory.ERROR,
                  timeout: 2200,
                });
              } else {
                const session_key = results.session_key;
                Cookies.set('session_key', session_key);
                location.href = 'my-profile';
              }
            })
            .catch(() => {
              notify({
                message: 'The reset password link is no longer valid',
                category: NotificationCategory.ERROR,
                timeout: 2200,
              });
              //   location.reload();
            });
        }
      }
    }
  }, [is_loading]);

  useEffect(() => {
    toggleLoader(false);
  }, []);

  return (
    <button
      type='button'
      className={className}
      onClick={() => {
        toggleLoader(true);
      }}
    >
      {is_loading ? <span>Loading...</span> : children}
    </button>
  );
}
