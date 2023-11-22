'use client';

import { useRouter } from 'next/navigation';
import { ReactElement } from 'react';

export default function MyListingsHomeButton({ children, href, ...attributes }: { className: string; children: ReactElement; href?: string }) {
  const router = useRouter();
  return (
    <button
      {...attributes}
      data-w-tab='Tab 1'
      onClick={() => {
        router.push('/my-listings');
      }}
      data-href={href}
      type='button'
    >
      {children}
    </button>
  );
}
