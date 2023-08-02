'use client';
import { removeKeys, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import useEvent, { Events } from '@/hooks/useEvent';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import SubmitGrid from './SubmitGrid';
import { SavedSearchInput, SavedSearch } from '@/_typings/saved-search';
import { saveSearch, updateSearch } from '@/_utilities/api-calls/call-saved-search';
import { AgentData } from '@/_typings/agent';
import RxHomeAlertForm from '@/components/RxForms/RxHomeAlertForm';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import Cookies from 'js-cookie';

type Props = {
  child: ReactElement;
  'agent-data': AgentData;
  onSave: (record: SavedSearch) => void;
};

export default function MyHomeAlertModalWrapper({ child, ...p }: Props) {
  const { data, fireEvent } = useEvent(Events.MyHomeAlertsModal);
  const { show, message, alertData } = data || {};
  const closeModal = () => {
    fireEvent({ show: false, message: '', alertData: undefined });
  };

  const initialState = {
    beds: 0,
    baths: 0,
    minprice: 0,
    maxprice: 0,
    minsqft: 0,
    maxsqft: 0,
    tags: '',
    lat: 0,
    lng: 0,
    nelat: 0,
    nelng: 0,
    swlat: 0,
    swlng: 0,
    city: '',
    year_built: 0,
    add_date: 0,
    dwelling_types: [],
  };
  const [formState, setFormState] = useState<SavedSearchInput>({ ...initialState, ...alertData });
  useEffect(() => {
    setFormState({ ...alertData });
  }, [show]);

  const resetClick = () => {
    setFormState({ ...alertData });
  };

  const saveClick = async () => {
    if (formState?.id) {
      await updateSearch(formState.id, p['agent-data'], { search_params: removeKeys(formState, ['id']) });
    } else {
      await saveSearch(p['agent-data'], { search_params: formState });
    }
    fireEvent({ show: false, message: '', reload: true });
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['new-home-alert-wrapper']),
      transformChild: (child: ReactElement) => {
        let customer = 0;
        if (getData('viewing_customer')) {
          const { id } = getData('viewing_customer') as unknown as {
            id: number;
          };
          customer = id;
        }
        return (
          <RxHomeAlertForm agent={p['agent-data']} customer={customer} className={child.props.className} reload={p.onSave}>
            {child.props.children}
          </RxHomeAlertForm>
        );
      },
      // transformChild: (child: ReactElement) =>
      //   cloneElement(child, { onClick: closeModal, style: { display: showModal ? 'flex' : 'none' }, 'data-rexifier': 'MyHomeAlertModalWrapper' }),
    },
    {
      searchFn: searchByClasses(['prop-type-section-label']),
      transformChild: (child: ReactElement) =>
        cloneElement(child, {}, [message ? `${message} ${formState.beds ? `${formState.beds}-br` : ''} ${formState.city || ''} Home Alert` : `New Home Alert`]),
    },
    {
      searchFn: searchByClasses(['close-link-right']),
      transformChild: (child: ReactElement) => cloneElement(child, { onClick: closeModal }),
    },
    {
      searchFn: searchByClasses(['property-type-modal']),
      transformChild: (child: ReactElement) => {
        const session = getData('viewing_customer') as unknown as {
          id: number;
        };
        let customer = 0;
        if (session?.id) {
          customer = Number(session.id);
        } else if (Cookies.get('session_as') === 'customer') {
          const hash = `${Cookies.get('session_key')}`.split('-');
          if (hash.length === 2) customer = Number(hash[1]);
        }
        return (
          <RxHomeAlertForm agent={p['agent-data']} customer={customer} className={child.props.className} reload={p.onSave}>
            {child.props.children}
          </RxHomeAlertForm>
        );
      },
    },
    {
      searchFn: searchByClasses(['modal-wrapper-right']),
      transformChild: (child: ReactElement) => <SubmitGrid child={child} resetClick={resetClick} saveClick={saveClick} />,
    },
  ];

  return <>{transformMatchingElements(child, matches)}</>;
}
