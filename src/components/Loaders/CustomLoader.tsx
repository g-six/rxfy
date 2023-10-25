'use client';
import { classNames } from '@/_utilities/html-helper';
import { ReactElement } from 'react';
import styles from './CustomLoader.module.scss';
import useEvent, { Events } from '@/hooks/useEvent';
export default function CustomLoader({ children, className, ...props }: { children: ReactElement; className?: string; 'data-loader': string }) {
  const { data } = useEvent(Events.Loading);
  const { loader } = data as unknown as {
    loader?: string;
  };
  return (
    <div {...props} className={classNames(className || 'no-class', loader && loader === props['data-loader'] ? styles.ai : '')}>
      {children}
    </div>
  );
}
