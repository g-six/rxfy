'use client';

import { ReactElement } from 'react';
import { AgentData } from '@/_typings/agent';
import ClientDashboardIterator from '@/rexify/realtors/ClientDashboardIterator.module';
import RxNotifications from '@/components/RxNotifications';

export default function MyDocumentsContainer({ agent, children }: { agent: AgentData; children: ReactElement }) {
  return (
    <>
      <ClientDashboardIterator
        id='MyDocuments'
        className={'RxCustomerView-ClientDashboardIterator rexified'}
        onCancel={() => {
          console.log('canceled');
        }}
        onConfirm={console.log}
        reload={console.log}
        agent={agent}
      >
        {children}
      </ClientDashboardIterator>
      <RxNotifications />
    </>
  );
}
