'use client';

import { ReactElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import ClientDashboardIterator from '@/rexify/realtors/ClientDashboardIterator.module';

export default function MyHomeAlerts({ agent, children }: { agent: AgentData; children: ReactElement }) {
  return (
    <ClientDashboardIterator
      id='SavedHome'
      className={'my-home-alerts ClientDashboardIterator rexified'}
      onCancel={() => {
        console.log('canceled');
      }}
      onConfirm={console.log}
      reload={console.log}
      agent={agent}
    >
      {children}
    </ClientDashboardIterator>
  );
}
