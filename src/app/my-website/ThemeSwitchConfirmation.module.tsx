'use client';
import { fireCustomEvent } from '@/_helpers/functions';
import { Events, EventsData, NotificationCategory } from '@/hooks/useFormEvent';
import { Children, ReactElement, cloneElement } from 'react';
import styles from './DomainHowModal.module.scss';
import { classNames } from '@/_utilities/html-helper';
import useEvent from '@/hooks/useEvent';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import Cookies from 'js-cookie';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
function CloseButton({ children }: { children: ReactElement }) {
  return (
    <div
      className={(children.props.className || '') + ' w-4 h-4 bg-no-repeat bg-center cursor-pointer'}
      onClick={() => {
        fireCustomEvent({} as unknown as EventsData, Events.UpdateThemeConfirmation);
      }}
      style={{
        backgroundImage: `url(${children.props.src})`,
      }}
    ></div>
  );
}
function Rexify({ children, ...props }: { children: ReactElement; submit(): void }) {
  const Rexified = Children.map(children, c => {
    if (c.type === 'div') {
      const { children: sub, ...subprops } = c.props;
      return (
        <div {...subprops}>
          <Rexify {...props}>{sub}</Rexify>
        </div>
      );
    }
    if (c.props?.className?.includes('-close') || c.props?.className?.includes('close-')) {
      return <CloseButton>{c}</CloseButton>;
    }
    if (c.props?.['data-action'] === 'cancel') {
      return (
        <button
          type='button'
          className={c.props.className || ''}
          onClick={() => {
            fireCustomEvent({} as unknown as EventsData, Events.UpdateThemeConfirmation);
          }}
        >
          {c.props.children}
        </button>
      );
    }
    if (c.props?.['data-action'] === 'confirm') {
      return (
        <button
          type='button'
          className={c.props.className || ''}
          onClick={() => {
            props.submit();
          }}
        >
          {c.props.children}
        </button>
      );
    }
    return c;
  });
  return <>{Rexified}</>;
}
export default function RxThemeSwitchConfirmation({ children, className }: { children: ReactElement; className: string }) {
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { fireEvent: updateForm } = useEvent(Events.UpdateTheme);
  const { data: confirmation, fireEvent: fireConfirmation } = useEvent(Events.UpdateThemeConfirmation);

  const { webflow_domain, website_theme } = confirmation as unknown as {
    webflow_domain?: string;
    website_theme?: string;
  };

  return (
    <div className={classNames(className, website_theme ? styles.show : '')}>
      <Rexify
        submit={() => {
          updateForm(confirmation as unknown as EventsData);
          fireConfirmation({});
          updateAccount(
            Cookies.get('session_key') as string,
            {
              webflow_domain,
              website_theme,
            },
            true,
          )
            .then(() => {
              notify({
                category: NotificationCategory.SUCCESS,
                message: `Your theme change request to ${capitalizeFirstLetter(website_theme as string)} has been logged and our team is setting it up.`,
                timeout: 3500,
              });
            })
            .finally(() => {
              fireCustomEvent({} as unknown as EventsData, Events.Blank);
            });
        }}
      >
        {children}
      </Rexify>
    </div>
  );
}
