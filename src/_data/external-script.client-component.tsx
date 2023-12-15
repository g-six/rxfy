'use client';

import { useEffect, useState } from 'react';

export default function ExternalScriptClient() {
  const [ready, toggleReady] = useState(false);
  useEffect(() => {
    if (ready) {
      document.dispatchEvent(new CustomEvent('external-scripts', { detail: { message: 'just a test' } }));
    }
  }, [ready]);
  useEffect(() => {
    toggleReady(true);
  }, []);
  return <></>;
}
