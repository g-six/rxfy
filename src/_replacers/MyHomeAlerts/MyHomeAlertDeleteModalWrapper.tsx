import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { AgentData } from '@/_typings/agent';
import { deleteSearch } from '@/_utilities/api-calls/call-saved-search';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import useEvent, { Events } from '@/hooks/useEvent';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  agent_data: AgentData;
  child: ReactElement;
};

export default function MyHomeAlertDeleteModalWrapper({ child, agent_data }: Props) {
  const { data, fireEvent } = useEvent(Events.MyHomeAlertsModal);
  const { key, show, message, alertData } = data || {};
  const closeModal = () => {
    fireEvent({ show: false, message: '', alertData: undefined });
  };
  const deleteCard = async () => {
    key && (await deleteSearch(key));
    fireEvent({ show: false, message: '', alertData: undefined, reload: true, key });
  };
  const showDelete = show && message && ['delete'].includes(message);
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['ha-delete-modal-wrapper']),
      transformChild: child => cloneElement(child, { onClick: closeModal, style: { display: showDelete ? 'flex' : 'none' } }),
    },
    {
      searchFn: searchByClasses(['modal-ha-delete']),
      transformChild: child =>
        cloneElement(child, {
          onClick: (e: React.SyntheticEvent) => {
            e.stopPropagation();
          },
        }),
    },
    {
      searchFn: searchByClasses(['delete-ha-cancel']),
      transformChild: child => cloneElement(child, { onClick: closeModal }),
    },
    {
      searchFn: searchByClasses(['close-link-right']),
      transformChild: child => cloneElement(child, { onClick: closeModal }),
    },
    {
      searchFn: searchByClasses(['delete-ha-confirm']),
      transformChild: child => cloneElement(child, { onClick: deleteCard }),
    },
  ];
  return <>{transformMatchingElements(child, matches)}</>;
}
