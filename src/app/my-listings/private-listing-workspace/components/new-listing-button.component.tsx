'use client';

import { ReactElement } from 'react';

export default function CreateNewListingButton({ children, href, ...attributes }: { className: string; children: ReactElement; href?: string }) {
  return (
    <button
      {...attributes}
      onClick={() => {
        window.location.href = '/my-listings';
      }}
      data-href={href}
      type='button'
    >
      {children}
    </button>
  );
}
