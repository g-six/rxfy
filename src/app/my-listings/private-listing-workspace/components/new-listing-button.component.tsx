'use client';

import { ReactElement } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateNewListingButton({ children, href, ...attributes }: { className: string; children: ReactElement; href?: string }) {
  const router = useRouter();

  return (
    <button
      {...attributes}
      data-w-tab='New Private listing'
      onClick={() => {
        router.push('/my-listings?action=new');
      }}
      data-href={href}
      type='button'
    >
      {children}
    </button>
  );
}
