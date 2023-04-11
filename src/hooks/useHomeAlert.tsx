import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { AgentData } from '@/_typings/agent';
import { Events } from '@/_typings/events';
// import { sendHomeAlertConfirm } from '@/_helpers/sendEmail';
// import { saveSearch } from '@/_helpers/api_apollo';
import useEvent from '@/hooks/useEvent';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import Cookies from 'js-cookie';

export default function useHomeAlert(agentData: AgentData) {
  const searchParams = useSearchParams();
  const eventHookSuccess = useEvent(Events.HomeAlertSuccess);
  const eventHookLoader = useEvent(Events.Loading);

  const onAction = useCallback(
    (step: number) => {
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
      eventHookLoader.fireEvent({ show: true });
      // const obj = user && user.jwt ? user : userData;
      if (Cookies.get('session_key')) {
        // const queryStr = searchParams.toString();
        // const id = obj && obj.client_profile ? obj.client_profile.id : 0;
        // saveSearch(id, queryStr, obj.jwt)
        //   .then(() => {
        //     eventHookLoader.fireEvent({ show: false });
        //     eventHookSuccess.fireEvent({ show: true });
        //     sendHomeAlertConfirm(obj.user.email, agentData, pass);
        //   })
        //   .catch(e => {
        //     if (e && !!e.msg) {
        //       console.error(e.msg);
        //     } else {
        //       console.error('Something went wrong.');
        //     }
        //   });
      }
    },
    [agentData, searchParams, eventHookSuccess, eventHookLoader],
  );

  return { onAction };
}
