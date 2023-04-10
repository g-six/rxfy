'use client';
import React, { ReactElement, cloneElement, useCallback, useState, Fragment } from 'react';
import axios from 'axios';
import { Transition } from '@headlessui/react';

import { ReplacerHomeAlerts } from '@/_typings/forms';
import { randomString } from '@/_utilities/data-helpers/auth-helper';
import { searchByClasses } from '@/_utilities/checkFnUtils';
import { transformMatchingElements } from '@/_helpers/findElements';
// import { UserData } from '@/_typings/user';
// import { updateUser } from '@/_apollo/cache';

import useHomeAlert from '@/hooks/useHomeAlert';
import useEvent, { Events } from '@/hooks/useEvent';
import { validateEmail } from '@/_utilities/validation-helper';

export default function HomeAlertsStep2({ child, agent, user, onClose, showIcon, isLoggedIn }: ReplacerHomeAlerts) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const hook = useHomeAlert(/*user, */ agent);
  const eventHookLoading = useEvent(Events.Loading);

  const onRegister = useCallback(
    (email: string) => {
      if (!validateEmail(email)) {
        setError('Please use correct email format.');
      } else {
        const em = email.toLowerCase();
        const name = em.replaceAll('@', ' ').replaceAll('.', '').replaceAll(/[0-9]/g, '');
        const pass = randomString(6);
        const host = typeof window !== 'undefined' ? window.location.host : '';
        const data = {
          username: em,
          email: em,
          password: pass,
          phone_number: '000-000-0000',
          user_type: 'user',
          name: name,
          signup_host: host,
        };
        //setLoading(true);
        eventHookLoading.fireEvent({ show: true });
        axios
          .post(
            '/api/sign-up',
            {
              agent: agent.id,
              logo: agent.metatags?.logo_for_light_bg,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
          .then(response => {
            eventHookLoading.fireEvent({ show: false });
            // hook.onAction(response, pass)
          });
        // registerUser(data, agent)
        //   .then(user => {
        //     updateUser(user, (obj: UserData) => {
        //       eventHookLoading.fireEvent({ show: false });
        //       hook.onAction(obj, pass);
        //     });
        //   })
        //   .catch(e => {
        //     if (e && !!e.msg) {
        //       setError(e.msg);
        //     } else {
        //       setError('Something went wrong.');
        //     }
        //   });
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
      searchFn: searchByClasses(['email-input-field---ha']),
      transformChild: (child: ReactElement) =>
        cloneElement(
          child,
          {
            ...child.props,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
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

  console.log('error', error);

  return showIcon || isLoggedIn ? (
    <></>
  ) : (
    <Transition
      key='confirmation'
      show={true}
      as={Fragment}
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
