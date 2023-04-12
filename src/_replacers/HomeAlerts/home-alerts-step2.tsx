'use client';
import React, { ReactElement, cloneElement, useCallback, useState, Fragment, useEffect } from 'react';
import axios from 'axios';
import { Transition } from '@headlessui/react';

import { ReplacerHomeAlerts } from '@/_typings/forms';
import { randomString } from '@/_utilities/data-helpers/auth-helper';
import { searchByClasses, searchById } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
// import { UserData } from '@/_typings/user';
// import { updateUser } from '@/_apollo/cache';

import useHomeAlert from '@/hooks/useHomeAlert';
import useEvent, { Events } from '@/hooks/useEvent';
import { validateEmail } from '@/_utilities/validation-helper';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { NotificationCategory } from '@/_typings/events';
import Cookies from 'js-cookie';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';

export default function HomeAlertsStep2({ child, agent, onClose, showIcon }: ReplacerHomeAlerts) {
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { fireEvent: notifySavedSearchSuccess } = useEvent(Events.HomeAlertSuccess);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [show, toggleShow] = useState(false);

  const hook = useHomeAlert(agent);
  const eventHookLoading = useEvent(Events.Loading);
  const onRegister = useCallback(
    (email: string) => {
      if (!validateEmail(email)) {
        setError('Please use correct email format.');
      } else {
        const em = email.toLowerCase();
        const name = em.replaceAll('@', ' ').replaceAll('.', '').replaceAll(/[0-9]/g, '');
        //setLoading(true);
        eventHookLoading.fireEvent({ show: true });

        notify({});
        hook.onAction(2, {
          email,
        });
      }
    },
    [hook.onAction],
  );

  const matches = [
    {
      searchFn: searchByClasses(['setup-ha-close-email']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            ...child.props,
            onClick: () => onClose(),
          },
          child.props.children,
        ),
    },
    {
      searchFn: searchById('email-form-4'),
      transformChild: (child: ReactElement) => {
        return cloneElement(
          <div />, // Change form to div
          {
            ...child.props,
            method: undefined,
            ['data-method']: child.props.method,
          },
          child.props.children,
        );
      },
    },
    {
      searchFn: searchByClasses(['email-input-field---ha']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            ...child.props,
            className: `${child.props.className} rexified`,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
            onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key.toLowerCase() === 'enter') {
                onRegister(e.currentTarget.value);
              }
            },
          },
          child.props.children,
        ),
    },
    {
      searchFn: searchByClasses(['setup-ha-2']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            ...child.props,
            onClick: () => onRegister(email),
          },
          child.props.children,
        ),
    },
  ];

  // hook

  useEffect(() => {
    if (getData('dismissSavedSearch') && getData('dismissSavedSearch') !== null) {
      const { step } = getData('dismissSavedSearch') as unknown as { step: number };
      toggleShow(step === 2);
    } else {
      toggleShow(false);
    }
  }, [hook]);

  useEffect(() => {
    toggleShow(!showIcon && !Cookies.get('session_key') && getData('dismissSavedSearch') !== null);
  }, []);

  return (
    <Transition
      key='confirmation'
      show={show}
      as='div'
      className='mx-auto'
      enter='transform ease-out duration-300 transition'
      enterFrom='translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
      enterTo='translate-y-0 opacity-100 sm:translate-x-0'
      leave='transition ease-in duration-100'
      leaveFrom='opacity-100'
      leaveTo='opacity-0'
    >
      {transformMatchingElements([child], matches)}
    </Transition>
  );
}
