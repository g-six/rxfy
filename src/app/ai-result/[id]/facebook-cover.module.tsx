'use client';
import { ReactElement, useRef } from 'react';
import { toJpeg } from 'html-to-image';
import { ClipboardIcon } from '@heroicons/react/24/solid';

function Iterator({ children }: { children: ReactElement }) {}

export default function FacebookCover({ props, children }: { props: { [k: string]: string }; children: ReactElement }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <>
      <div {...props} ref={ref}>
        {children}
      </div>
      <button>
        <ClipboardIcon className='w-10 h-10 absolute top-0 right-0' />
      </button>
    </>
  );
}
