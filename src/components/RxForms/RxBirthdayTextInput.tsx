'use client';

import { Events } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import React, { useEffect, useState } from 'react';

type RxProps = {
  name: string;
  className?: string;
  defaultValue?: string;
  children: React.ReactElement;
  data?: Record<string, string>;
  placeholder?: string;
  ['rx-event']: Events;
};
export function RxBirthdayTextInput(p: RxProps) {
  const evt = useEvent(p['rx-event']);
  const years: number[] = [];
  const [d, setDay] = useState(p.defaultValue ? Number(p.defaultValue.split('/')[0]) : 1);
  const [m, setMonth] = useState(p.defaultValue ? Number(p.defaultValue.split('/')[1]) : 1);
  const [y, setYear] = useState(p.defaultValue ? Number(p.defaultValue.split('/')[2]) : new Date().getFullYear() - 21);
  const [days, setDays] = useState<number[]>([]);

  for (let i = new Date().getFullYear() - 16; i > new Date().getFullYear() - 100; i--) {
    years.push(i);
  }

  const updateValue = ({ d, m, y }: { [key: string]: number }) => {
    evt.fireEvent({
      ...evt.data,
      [`${p.name}`]: `${d}/${m}/${y}`,
    });
  };

  useEffect(() => {
    const dt = new Date(y, m - 1, 1);
    dt.setMonth(m);
    dt.setDate(0);
    const ds = [];
    for (let i = 1; i <= dt.getDate(); i++) {
      ds.push(i);
    }
    setDays(ds);

    updateValue({ d, m, y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, m, y]);

  useEffect(() => {
    if (p.defaultValue) {
      setDay(Number(p.defaultValue.split('/')[0]));
      setMonth(Number(p.defaultValue.split('/')[1]));
      setYear(Number(p.defaultValue.split('/')[2]));
      updateValue({ d: Number(p.defaultValue.split('/')[0]), m: Number(p.defaultValue.split('/')[1]), y: Number(p.defaultValue.split('/')[2]) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={[p.className || '', 'rexified'].join(' ').trimStart()}>
      <select
        id='birth-day'
        name='bday'
        className='rexified w-10 border-0 p-0 text-gray-900 outline-0 ring-0 ring-inset ring-gray-300 focus:ring-0 sm:text-sm sm:leading-6'
        onChange={e => {
          setDay(Number(e.currentTarget.value));
        }}
        defaultValue={d}
      >
        {days.map(day => (
          <option value={day} key={day}>
            {day}
          </option>
        ))}
      </select>

      <select
        id='birth-month'
        name='bmonth'
        className='rexified w-24 border-0 p-0 text-gray-900 outline-0 ring-0 ring-inset ring-gray-300 focus:ring-0 sm:text-sm sm:leading-6'
        onChange={e => {
          setMonth(Number(e.currentTarget.value));
        }}
        defaultValue={m}
      >
        <option value='01'>January</option>
        <option value='02'>February</option>
        <option value='03'>March</option>
        <option value='04'>April</option>
        <option value='05'>May</option>
        <option value='06'>June</option>
        <option value='07'>July</option>
        <option value='08'>August</option>
        <option value='09'>September</option>
        <option value='10'>October</option>
        <option value='11'>November</option>
        <option value='12'>December</option>
      </select>

      <select
        id='birth-year'
        name='byear'
        className='rexified w-16 border-0 p-0 text-gray-900 outline-0 ring-0 ring-inset ring-gray-300 focus:ring-0 sm:text-sm sm:leading-6'
        onChange={e => {
          setYear(Number(e.currentTarget.value));
        }}
      >
        {years.map(year => (
          <option value={year} key={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
