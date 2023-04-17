import React from 'react';
import styles from './RxMyClients.module.scss';
type MyClientsProps = {
  children: React.ReactElement;
  className?: string;
};
export function RxMyClients(p: MyClientsProps) {
  return <section className={`rexified ${p.className || ''} ${styles['clients-cards']}`}>{p.children}</section>;
}
