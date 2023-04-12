import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

import { BaseUser } from '@/_typings/base-user';
import { HomeAlertStep } from '@/_typings/home-alert';
import { AgentData } from '@/_typings/agent';

import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import { randomString } from '@/_utilities/data-helpers/auth-helper';
import { capitalizeFirstLetter } from '@/_utilities/formatters';

import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';

export default function useHomeAlert(agentData: AgentData) {
  const searchParams = useSearchParams();
  const eventHookSuccess = useEvent(Events.HomeAlertSuccess);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const eventHookLoader = useEvent(Events.Loading);

  const onDismiss = useCallback((step: HomeAlertStep) => {
    setData(
      'dismissSavedSearch',
      JSON.stringify(
        {
          dismissed_at: new Date().toISOString(),
          step,
        },
        null,
        2,
      ),
    );
  }, []);

  const onAction = useCallback(
    (step: HomeAlertStep, data?: BaseUser) => {
      setData(
        'dismissSavedSearch',
        JSON.stringify(
          {
            step,
            data,
          },
          null,
          2,
        ),
      );
      eventHookLoader.fireEvent({ show: true });
      if (data && data.email) {
        notify({});
        axios
          .post(
            '/api/sign-up',
            {
              ...data,
              agent: Number(agentData.id),
              logo: agentData.metatags?.logo_for_light_bg,
              full_name: capitalizeFirstLetter(data.email.split('@')[0]),
              password: randomString(6),
              yes_to_marketing: true,
              search_url: searchParams.toString(),
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
          .then(response => {
            eventHookLoader.fireEvent({ show: false });
            eventHookSuccess.fireEvent({ ...response, show: true });
          })
          .catch(({ response }) => {
            notify({
              category: NotificationCategory.Error,
              message: response?.data?.error || 'Sorry, please try again later',
            });
          });
      } else if (Cookies.get('session_key') && Cookies.get('cid')) {
        axios
          .post(
            `/api/saved-searches/${Cookies.get('cid')}`,
            {
              ...data,
              agent: Number(agentData.id),
              logo: agentData.metatags?.logo_for_light_bg,
              search_url: searchParams.toString(),
            },
            {
              headers: {
                Authorization: `Bearer ${Cookies.get('session_key')}`,
                'Content-Type': 'application/json',
              },
            },
          )
          .then(response => {
            eventHookLoader.fireEvent({ show: false });
            eventHookSuccess.fireEvent({ ...response, show: true });
          })
          .catch(({ response }) => {
            notify({
              category: NotificationCategory.Error,
              message: response?.data?.error || 'Sorry, please try again later',
            });
          });
      }
    },
    [agentData, searchParams, eventHookSuccess, eventHookLoader],
  );

  return { onAction, onDismiss };
}
