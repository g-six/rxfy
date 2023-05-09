'use client';
import React from 'react';

export default function RxContactFormButton(p: { className: string; children: React.ReactElement[] }) {
  return (
    <button className={[p.className, 'rexified'].join(' ').trim()} type='button'>
      {p.children}
    </button>
  );
}
