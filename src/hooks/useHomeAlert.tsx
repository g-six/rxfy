import { useCallback } from 'react';
import Cookies from 'js-cookie';

import { AgentData } from '@/_typings/agent';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import { Events, NotificationCategory } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import { BaseUser } from '@/_typings/base-user';
import { HomeAlertStep } from '@/_typings/home-alert';
import { signUp } from '@/_utilities/api-calls/call-signup';
import { saveSearch } from '@/_utilities/api-calls/call-saved-search';
import { SavedSearchInput } from '@/_typings/saved-search';
import { queryStringToObject } from '@/_utilities/url-helper';

export default function useHomeAlert(agentData: AgentData) {
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
    ({ step, data, url }: { step: HomeAlertStep; data?: BaseUser; url: string }) => {
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
        const { searchParams } = new URL(url);
        signUp(
          {
            id: Number(agentData.id),
            logo: agentData.metatags?.logo_for_light_bg,
          },
          {
            email: data.email,
            agent_metatag_id: agentData.metatags.id,
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
      } else if (Cookies.get('session_key') && step === 2) {
        const { searchParams } = new URL(url);
        let search_params: SavedSearchInput = queryStringToObject(searchParams.toString());
        saveSearch(
          {
            id: Number(agentData.id),
            logo: agentData.metatags?.logo_for_light_bg,
          },
          {
            search_params,
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
    [agentData, eventHookSuccess, eventHookLoader],
  );

  return { onAction, onDismiss };
}
