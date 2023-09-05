'use client';
import { getHistory } from '@/_utilities/api-calls/call-properties';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import React, { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { SoldHistory } from './type.definition';

function GroupIterator(p: { history: SoldHistory[]; children: ReactElement; className?: string }) {
  const Rexified = Children.map(p.children, c => {
    if (!c.props.children || typeof c.props?.children === 'string') {
      return c;
    }
    const { children: cc } = c.props;
    return p.history?.length ? (
      p.history.map(history => {
        const columns = Children.map(cc, col => {
          if (col.props?.['data-field']) {
            let val = '';
            switch (col.props['data-field']) {
              case 'other_sold_price':
                val = `${formatValues({ asking_price: history.sold_at_price }, 'asking_price')}`;
                break;
              case 'other_sold_change_date':
                const [year, month, day] = history.date_sold.split('-').map(Number);
                val = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(year, month - 1, day));
                break;
              case 'other_sold_mls_number':
                val = `${history.mls_id}`;
                break;
            }
            return cloneElement(<span />, col.props, val);
          }
        });

        return (
          <a key={history.mls_id} href={`?mls=${history.mls_id}`} className={classNames(c.props.className, 'hover:underline')}>
            {columns}
          </a>
        );
      })
    ) : (
      <center>N/A</center>
    );
  });
  return <div className={p.className}>{Rexified}</div>;
}

export default function SoldHistory(p: { children: ReactElement; className?: string; address: string; postal_zip_code: string }) {
  const [history, setHistory] = useState<SoldHistory[]>([]);

  useEffect(() => {
    getHistory(p.address, p.postal_zip_code).then((records: SoldHistory[]) => {
      if (records && records.length) setHistory(records);
    });
  }, []);

  return (
    <section className={p.className}>
      <GroupIterator history={history}>{p.children}</GroupIterator>
    </section>
  );
}
