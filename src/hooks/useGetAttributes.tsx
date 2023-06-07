import { getPropertyAttributes } from '@/_utilities/api-calls/call-property-attributes';
import React, { useEffect, useState } from 'react';

type Props = {};

export default function useGetAttributes() {
  const [attributes, setAttributes] = useState();
  useEffect(() => {
    getPropertyAttributes().then((res: { [key: string]: { id: number; name: string }[] }) => {
      const remapped = Object.entries(res).map(([key, val]: [string, { id: number; name: string }[]]) => [
        key,
        val.map(({ id, name }) => ({ label: name, value: id })),
      ]);

      setAttributes(Object.fromEntries(remapped));
    });
  }, []);
  return attributes;
}
