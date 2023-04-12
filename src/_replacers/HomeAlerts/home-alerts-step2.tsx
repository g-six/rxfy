'use client';
import React, { ReactElement, cloneElement, useCallback, useState, Fragment, useEffect } from 'react';
import axios from 'axios';
import { Transition } from '@headlessui/react';

import { ReplacerHomeAlerts } from '@/_typings/forms';
import { searchByClasses, searchById } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';

import useHomeAlert from '@/hooks/useHomeAlert';
import useEvent, { Events } from '@/hooks/useEvent';
import { validateEmail } from '@/_utilities/validation-helper';
import Cookies from 'js-cookie';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { HomeAlertStep } from '@/_typings/home-alert';

export default function HomeAlertsStep2({ child, agent }: ReplacerHomeAlerts) {
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { fireEvent: notifySavedSearchSuccess } = useEvent(Events.HomeAlertSuccess);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [show, toggleShow] = useState(false);

  const hook = useHomeAlert(agent);
  const onRegister = useCallback(
    (email: string) => {
      if (!validateEmail(email)) {
        setError('Please use correct email format.');
      } else {
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
            onClick: () => {
              hook.onDismiss(HomeAlertStep.STEP_2);
              toggleShow(false);
            },
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
      const { dismissed_at, step } = getData('dismissSavedSearch') as unknown as { dismissed_at: string; step: number };
      toggleShow(step === HomeAlertStep.STEP_2 && dismissed_at === undefined);
    } else {
      toggleShow(false);
    }
  }, [hook]);

  useEffect(() => {
    toggleShow(!Cookies.get('session_key') && getData('dismissSavedSearch') !== null);
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
