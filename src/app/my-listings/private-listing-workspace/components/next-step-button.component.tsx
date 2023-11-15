'use client';

import { PrivateListingModel } from '@/_typings/private-listing';
import { classNames } from '@/_utilities/html-helper';
import SpinningDots from '@/components/Loaders/SpinningDots';
import useFormEvent, { Events, PrivateListingData } from '@/hooks/useFormEvent';
import { ReactElement } from 'react';

export default function MyListingsNextStepButton({
  children,
  listing,
  href = '#',
  className,
  beforeNext = async () => {},
  ...props
}: {
  children: ReactElement;
  className: string;
  href?: string;
  'data-next-step'?: string;
  listing?: PrivateListingModel;
  beforeNext?(): Promise<void>;
}) {
  const handler = useFormEvent<PrivateListingData>(Events.PrivateListingForm, { beds: 0, baths: 0, floor_area_uom: 'sqft', lot_uom: 'sqft' });
  return (
    <button
      {...props}
      className={classNames(className, handler.data?.submit ? 'animate-pulse' : '')}
      data-href={href}
      type='button'
      onClick={() => {
        if (props['data-next-step']) {
          const Tab = document.querySelector(`a[data-w-tab="${props['data-next-step']}"]`);
          handler.fireEvent({
            submit: true,
          });
          beforeNext()
            .then(() => {
              Tab && (Tab as HTMLAnchorElement).click();
            })
            .finally(() => {
              handler.fireEvent({
                submit: false,
              });
            });
        }
      }}
    >
      {handler.data?.submit && <SpinningDots className='fill-white mr-2' />}
      {children}
    </button>
  );
}
