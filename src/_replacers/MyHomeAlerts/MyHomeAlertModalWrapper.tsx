'use client';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchById } from '@/_utilities/rx-element-extractor';
import useEvent, { Events } from '@/hooks/useEvent';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';
import MyHomeAlertForm from './MyHomeAlertForm';
import SubmitGrid from './SubmitGrid';

type Props = {
  child: ReactElement;
};

export default function MyHomeAlertModalWrapper({ child }: Props) {
  const { data, fireEvent } = useEvent(Events.MyHomeAlertsModal);
  const { show, message, alertData } = data || {};
  const closeModal = () => {
    fireEvent({ show: false, message: '', alertData: undefined });
  };
  const initialState = {
    beds: alertData?.beds ?? 0,
    baths: alertData?.baths ?? 0,
    minprice: alertData?.minprice ?? '',
    maxprice: alertData?.maxprice ?? '',
    minsqft: alertData?.minsqft ?? '',
    maxsqft: alertData?.maxsqft ?? '',
    tags: alertData?.tags !== null ? alertData?.tags : '',
    lat: alertData?.lat ?? 0,
    lng: alertData?.lng ?? 0,
    nelat: alertData?.nelat ?? 0,
    nelng: alertData?.nelng ?? 0,
    swlat: alertData?.swlat ?? 0,
    swlng: alertData?.swlng ?? 0,
    city: alertData?.city ?? '',
    build_year: alertData?.build_year ?? '',
    add_date: alertData?.add_date ?? '',
    dwelling_types: [],
  };
  const [formState, setFormState] = useState<any>({ ...initialState });
  useEffect(() => {
    setFormState({ ...initialState });
  }, [alertData]);
  const handleFormChange = (key: string, val: any) => {
    setFormState((prev: any) => ({ ...prev, [key]: val }));
  };
  const handleFormCityChange = (val: any) => {
    setFormState((prev: any) => ({ ...prev, ...val }));
  };
  const resetClick = () => {
    setFormState({ ...initialState });
  };
  const saveClick = () => {
    console.log({ formState });
    closeModal();
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['new-home-alert-wrapper']),
      transformChild: (child: ReactElement) => cloneElement(child, { onClick: closeModal, style: { display: data?.show ? 'flex' : 'none' } }),
    },
    {
      searchFn: searchByClasses(['prop-type-section-label']),
      transformChild: (child: ReactElement) => cloneElement(child, {}, [message ? `${message} Some Title` : `New Home Alert`]),
    },
    {
      searchFn: searchByClasses(['close-link-right']),
      transformChild: (child: ReactElement) => cloneElement(child, { onClick: closeModal }),
    },
    {
      searchFn: searchByClasses(['property-type-modal']),
      transformChild: (child: ReactElement) =>
        cloneElement(child, {
          onClick: (e: React.SyntheticEvent) => {
            e.stopPropagation();
          },
        }),
    },
    {
      searchFn: searchById('email-form'),
      transformChild: (child: ReactElement) =>
        show ? <MyHomeAlertForm child={child} formState={formState} handleChange={handleFormChange} handleFormCityChange={handleFormCityChange} /> : <></>,
    },
    {
      searchFn: searchByClasses(['modal-wrapper-right']),
      transformChild: (child: ReactElement) => <SubmitGrid child={child} resetClick={resetClick} saveClick={saveClick} />,
    },
  ];

  return <>{transformMatchingElements(child, matches)}</>;
}
