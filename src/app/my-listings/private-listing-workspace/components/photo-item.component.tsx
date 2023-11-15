'use client';

import { classNames } from '@/_utilities/html-helper';
import { Children, ReactElement, cloneElement } from 'react';

export function MyListingPhotoBucketItem({
  children,
  className,
  url,
  position,
  onRemove,
  ...props
}: {
  children: ReactElement;
  className: string;
  url: string;
  position: number;
  onRemove(): void;
}) {
  return (
    <div
      style={{
        backgroundImage: `url(${url})`,
      }}
      className={classNames(className, 'bg-no-repeat bg-cover bg-center')}
    >
      {Children.map(children, c => {
        if (c.props && c.props.className?.includes('delete')) {
          return cloneElement(c, { onClick: onRemove });
        }
        return c;
      })}
    </div>
  );
}
