'use client';

import { ReactElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import ClientDashboardIterator from '@/rexify/realtors/ClientDashboardIterator.module';
import RxMyHomeAlerts from '@/components/full-pages/RxMyHomeAlerts';
import { SavedSearchOutput } from '@/_typings/saved-search';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function MyHomeAlerts({ agent, children, ...props }: { agent: AgentData; children: ReactElement; records: SavedSearchOutput[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [records, setRecords] = useState<SavedSearchOutput[] | null>(null);
  useEffect(() => {
    if (search.get('unsub')) {
      router.replace(pathname);
    }
    setRecords(props.records);
  }, []);

  return records ? <RxMyHomeAlerts className={'test'} agent-data={agent} child={children} records={records} /> : <></>;
}
