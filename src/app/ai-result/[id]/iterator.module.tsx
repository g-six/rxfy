'use client';
import { AgentData } from '@/_typings/agent';
import { ReactElement, useEffect, useState } from 'react';

export default function Iterator(p: { agent: AgentData; children: ReactElement }) {
  const [is_loaded, toggleLoaded] = useState(false);
  useEffect(() => {
    console.log(p.agent);
    toggleLoaded(true);
  }, []);
  return is_loaded ? <>{p.children}</> : <></>;
}
