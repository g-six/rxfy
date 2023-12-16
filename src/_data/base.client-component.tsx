'use client';

import { ReactElement, cloneElement, useEffect, useState } from 'react';

export default function BaseClientComponent({ component }: { component: ReactElement }) {
  const [is_ready, toggleReady] = useState(false);
  useEffect(() => {
    toggleReady(true);
  }, []);

  return is_ready ? cloneElement(component, { 'data-component': undefined }) : cloneElement(component, { 'data-component': undefined });
}
