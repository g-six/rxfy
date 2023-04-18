import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';

import { AgentData } from '@/_typings/agent';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import { Events, NotificationCategory } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import { BaseUser } from '@/_typings/base-user';
import { HomeAlertStep } from '@/_typings/home-alert';
import { signUp } from '@/_utilities/api-calls/call-signup';
import { saveSearch } from '@/_utilities/api-calls/call-saved-search';

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
        signUp(
          {
            id: Number(agentData.id),
            logo: agentData.metatags?.logo_for_light_bg,
          },
          {
            email: data.email,
          },
          {
            search_url: searchParams.toString(),
          },
        )
          .then(response => {
            eventHookLoader.fireEvent({ show: false });
            eventHookSuccess.fireEvent({ ...response, show: true });
          })
          .catch(({ response }) => {
            notify({
              category: NotificationCategory.ERROR,
              message: response?.data?.error || 'Sorry, please try again later',
            });
          });
      } else if (Cookies.get('session_key') && Cookies.get('guid') && step === 2) {
        saveSearch(
          {
            id: Number(agentData.id),
            logo: agentData.metatags?.logo_for_light_bg,
          },
          {
            search_url: searchParams.toString(),
          },
        )
          .then(response => {
            eventHookLoader.fireEvent({ show: false });
            eventHookSuccess.fireEvent({ ...response, show: true });
          })
          .catch(({ response }) => {
            notify({
              category: NotificationCategory.ERROR,
              message: response?.data?.error || 'Sorry, please try again later',
            });
          });
      }
    },
    [agentData, searchParams, eventHookSuccess, eventHookLoader],
  );

  return { onAction, onDismiss };
}
