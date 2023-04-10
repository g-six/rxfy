import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { UserData } from '@/_typings/user';
import { AgentData } from '@/_typings/agent';
import { Events } from '@/_typings/events';
// import { sendHomeAlertConfirm } from '@/_helpers/sendEmail';
// import { saveSearch } from '@/_helpers/api_apollo';
import useEvent from '@/hooks/useEvent';
import { setData } from '@/_utilities/data-helpers/local-storage-helper';
import Cookies from 'js-cookie';

export default function useHomeAlert(/*userData: UserData, */ agentData: AgentData) {
  const searchParams = useSearchParams();
  const eventHookSuccess = useEvent(Events.HomeAlertSuccess);
  const eventHookLoader = useEvent(Events.Loading);

  const onAction = useCallback(
    (user: UserData, pass: string | undefined) => {
      // const obj = user && user.jwt ? user : userData;
      if (Cookies.get('session_key')) {
        // const queryStr = searchParams.toString();
        // const id = obj && obj.client_profile ? obj.client_profile.id : 0;
        eventHookLoader.fireEvent({ show: true });
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
      } else {
        setData('dismissSavedSearch', { dismissed_at: new Date().toISOString() });
      }
    },
    [userData, agentData, searchParams, eventHookSuccess, eventHookLoader],
  );

  return { onAction };
}
