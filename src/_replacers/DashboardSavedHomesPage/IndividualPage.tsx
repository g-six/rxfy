'use client';
import React, { ReactElement, useEffect, useState } from 'react';
import useEvent, { Events } from '@/hooks/useEvent';
import { getMLSProperty } from '@/_utilities/api-calls/call-properties';

type Props = {
  child: ReactElement;
};

export default function IndividualPage({ child }: Props) {
  const [currentProperty, setCurrentProperty] = useState(null);
  const { data, fireEvent } = useEvent(Events.LovedItem);

  useEffect(() => {
    if (data.message) {
      getMLSProperty(data.message).then(res => {
        console.log(res);
      });
    }
  }, [data.message]);
  return <>{child}</>;
}
