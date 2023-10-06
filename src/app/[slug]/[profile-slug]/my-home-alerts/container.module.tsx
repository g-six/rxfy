'use client';

import { ReactElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import ClientDashboardIterator from '@/rexify/realtors/ClientDashboardIterator.module';
import RxMyHomeAlerts from '@/components/full-pages/RxMyHomeAlerts';
import { SavedSearchOutput } from '@/_typings/saved-search';

export default function MyHomeAlerts({ agent, children, ...props }: { agent: AgentData; children: ReactElement; records: SavedSearchOutput[] }) {
  const [records, setRecords] = useState<SavedSearchOutput[] | null>(null);

  useEffect(() => {
    setRecords(props.records);
  }, []);

  // <ClientDashboardIterator
  //   id='SavedHome'
  //   className={'my-home-alerts ClientDashboardIterator rexified'}
  //   onCancel={() => {
  //     console.log('canceled');
  //   }}
  //   onConfirm={console.log}
  //   reload={console.log}
  //   agent={agent}
  // >
  //   {children}
  // </ClientDashboardIterator>
  return records ? <RxMyHomeAlerts className={'test'} agent-data={agent} child={children} records={records} /> : <></>;
}
