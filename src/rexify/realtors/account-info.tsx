'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import { RealtorInputModel } from '@/_typings/agent';
import { RxPageIterator } from '@/components/full-pages/RxMyAccountPage';

type Props = {
  children: React.ReactElement[];
  className?: string;
};

export default function RealtorAccountInfo(p: Props) {
  const [form_data, setFormData] = React.useState<RealtorInputModel>();

  return (
    <div className={[p.className || '', 'rexified'].join(' ').trim()}>
      <RxPageIterator type='div' data={form_data || {}} {...p} onSubmit={() => {}}>
        <>{p.children}</>
      </RxPageIterator>
    </div>
  );
}
