import { useMapMultiUpdater, useMapState } from '@/app/AppContext.module';
import { MapStatePropsWithFilters } from '@/_typings/property';
import React, { ReactNode, useRef, useState } from 'react';
import DatePicker, { CalendarContainer } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import styles from './RxDatePicker.module.scss';

interface DatePickerProps {
  className: string;
  filter: string;
  placeholder?: string;
}

export function RxDatePickerContainer() {
  const fn = ({ children, className }: { children: ReactNode; className: string }) => (
    <div style={{ zIndex: 1990 }} className={styles.calendarPopupWrapper}>
      <CalendarContainer className={className}>
        <div style={{ position: 'relative' }}>{children}</div>
      </CalendarContainer>
    </div>
  );

  return fn;
}

function getDate(dt: Date) {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'long' }).format(dt as unknown as Date);
}

export default function RxDatePicker(p: DatePickerProps) {
  const state: MapStatePropsWithFilters = useMapState();
  const ref = useRef(null);
  const updater = useMapMultiUpdater();
  const [is_shown, togglePopup] = useState<boolean>(false);
  return (
    <>
      <input
        {...p}
        type='text'
        className={p.className}
        disabled={is_shown}
        onClick={() => {
          togglePopup(true);
        }}
        ref={ref}
        onBlur={e => {
          togglePopup(false);
        }}
        defaultValue={state[p.filter] ? new Intl.DateTimeFormat('en-CA', { dateStyle: 'long' }).format(state[p.filter] as unknown as Date) : ''}
      />

      <DatePicker
        className={p.className}
        selected={state[p.filter] as unknown as Date}
        onChange={date => {
          if (date !== null) {
            updater(state, {
              [p.filter]: date as Date,
            });
            togglePopup(false);
            // if (ref && ref.current) (ref.current as any).focus();
          }
        }}
        onBlur={() => {
          togglePopup(false);
        }}
        onClickOutside={() => {
          togglePopup(false);
        }}
        calendarClassName={[styles.calendarPopup, is_shown ? styles.shown : '-top-full -translate-y-full'].join(' ')}
        dayClassName={date => (getDate(date) === getDate(state[p.filter] as unknown as Date) ? styles.selectedDate : '')}
        inline
        open={false}
      />
    </>
  );
}
