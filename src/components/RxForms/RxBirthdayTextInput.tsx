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
  const [d, setDay] = useState<string>();
  const [m, setMonth] = useState<string>();
  const [y, setYear] = useState<string>();
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

  // useEffect(() => {
  //   const dt = new Date(y, m - 1, 1);
  //   dt.setMonth(m);
  //   dt.setDate(0);
  //   const ds = [];
  //   for (let i = 1; i <= dt.getDate(); i++) {
  //     ds.push(i);
  //   }
  //   setDays(ds);

  // updateValue({ d, m, y });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [d, m, y]);

  const updateAndSet = () => {
    if (p.defaultValue) {
      const dmy = [Number(p.defaultValue.split('/')[0]), Number(p.defaultValue.split('/')[1]), Number(p.defaultValue.split('/')[2])];
      const dt = new Date(dmy[2], dmy[1] - 1, dmy[2]);
      dt.setMonth(dmy[1]);
      dt.setDate(0);
      const ds = [];

      for (let i = 1; i <= dt.getDate(); i++) {
        ds.push(i);
      }
      setDay(`${dmy[0] < 10 ? '0' : ''}${dmy[0]}`);
      setMonth(`${dmy[1] < 10 ? '0' : ''}${dmy[1]}`);
      setYear(`${dmy[2]}`);
      setDays(ds);
    }
  };

  useEffect(() => {
    updateAndSet();
  }, [p.defaultValue]);

  useEffect(() => {
    if (days.length) {
      console.log({ d, m, y });
    }
  }, [days, d, m, y]);

  useEffect(() => {
    updateAndSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={[p.className || '', 'rexified'].join(' ').trimStart()}>
      <select
        id='birth-day'
        name='bday'
        className='rexified w-10 border-0 p-0 text-gray-900 outline-0 ring-0 ring-inset ring-gray-300 focus:ring-0 sm:text-sm sm:leading-6'
        onChange={e => {
          setDay(e.currentTarget.value);
        }}
        value={d}
      >
        {days.map(day => (
          <option value={`${day < 10 ? '0' : ''}${day}`} key={day}>
            {day}
          </option>
        ))}
      </select>

      <select
        id='birth-month'
        name='bmonth'
        className='rexified w-24 border-0 p-0 text-gray-900 outline-0 ring-0 ring-inset ring-gray-300 focus:ring-0 sm:text-sm sm:leading-6'
        onChange={e => {
          setMonth(e.currentTarget.value);
        }}
        value={m}
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
          setYear(e.currentTarget.value);
        }}
        value={y}
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
