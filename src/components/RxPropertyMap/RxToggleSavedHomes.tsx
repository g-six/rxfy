'use client';
import React from 'react';
import axios from 'axios';

import { getData } from '@/_utilities/data-helpers/local-storage-helper';

type Props = {
  children: React.ReactElement;
  className?: string;
  onClick: () => void;
};
export default function RxToggleSavedHomes(p: Props) {
  return (
    <button className='bg-transparent p-0 m-0 ring-0 border-none' onClick={p.onClick}>
      <span className={p.className}>{p.children}</span>
    </button>
  );
}
