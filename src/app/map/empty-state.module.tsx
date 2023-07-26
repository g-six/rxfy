import styles from './home-list.module.scss';
export default function EmptyState({ className, children }: { className: string; children: React.ReactElement }) {
  return <div className={[className, styles['empty-state'], 'rexified HomeList-EmptyState'].join(' ')}>{children}</div>;
}
