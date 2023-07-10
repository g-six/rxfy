'use client';
import { removeKeys, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchById } from '@/_utilities/rx-element-extractor';
import useEvent, { Events } from '@/hooks/useEvent';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import MyHomeAlertForm from './MyHomeAlertForm';
import SubmitGrid from './SubmitGrid';
import { SavedSearchInput } from '@/_typings/saved-search';
import { saveSearch, updateSearch } from '@/_utilities/api-calls/call-saved-search';
import { AgentData } from '@/_typings/agent';
import RxHomeAlertForm from '@/components/RxForms/RxHomeAlertForm';

type Props = {
  child: ReactElement;
  agent_data: AgentData;
};

export default function MyHomeAlertModalWrapper({ child, agent_data }: Props) {
  const { data, fireEvent } = useEvent(Events.MyHomeAlertsModal);
  const { show, message, alertData } = data || {};
  const showModal = show && message && ['New', 'Edit'].includes(message);
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
    build_year: 0,
    add_date: 0,
    dwelling_types: [],
  };
  const [formState, setFormState] = useState<SavedSearchInput>({ ...initialState, ...alertData });
  useEffect(() => {
    setFormState({ ...alertData });
  }, [show]);
  const handleFormChange = (key: string, val: any) => {
    setFormState((prev: any) => ({ ...prev, [key]: val }));
  };
  const handleFormCityChange = (val: any) => {
    setFormState((prev: any) => ({ ...prev, ...val }));
  };
  const resetClick = () => {
    setFormState({ ...alertData });
  };

  const saveClick = async () => {
    if (formState?.id) {
      await updateSearch(formState.id, agent_data, { search_params: removeKeys(formState, ['id']) });
    }
    if (!formState.id) {
      await saveSearch(agent_data, { search_params: formState });
    }
    fireEvent({ show: false, message: '', reload: true, alertData: formState });
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['new-home-alert-wrapper']),
      transformChild: (child: ReactElement) =>
        cloneElement(child, { onClick: closeModal, style: { display: showModal ? 'flex' : 'none' }, 'data-rexifier': 'MyHomeAlertModalWrapper' }),
    },
    {
      searchFn: searchByClasses(['prop-type-section-label']),
      transformChild: (child: ReactElement) =>
        cloneElement(child, {}, [message ? `${message} ${formState.beds ? `${formState.beds}-br` : ''} ${formState.city} Home Alert` : `New Home Alert`]),
    },
    {
      searchFn: searchByClasses(['close-link-right']),
      transformChild: (child: ReactElement) => cloneElement(child, { onClick: closeModal }),
    },
    {
      searchFn: searchByClasses(['property-type-modal']),
      transformChild: (child: ReactElement) => <RxHomeAlertForm className={child.props.className}>{child.props.children}</RxHomeAlertForm>,
      // cloneElement(child, {
      //   onClick: (e: React.SyntheticEvent) => {
      //     e.stopPropagation();
      //   },
      //   children: ,
      // }),
    },
    // {
    //   searchFn: searchById('email-form'),
    //   transformChild: (child: ReactElement) => (
    //     <MyHomeAlertForm child={child} formState={formState} handleChange={handleFormChange} handleFormCityChange={handleFormCityChange} />
    //   ),
    // },
    {
      searchFn: searchByClasses(['modal-wrapper-right']),
      transformChild: (child: ReactElement) => <SubmitGrid child={child} resetClick={resetClick} saveClick={saveClick} />,
    },
  ];

  return <>{transformMatchingElements(child, matches)}</>;
}
