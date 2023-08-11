import { classNames } from '@/_utilities/html-helper';
import styles from './loading.module.scss';

export function CenterLoader() {
  return (
    <div className='w-full flex items-center justify-center'>
      <div className='relative mx-auto w-12 h-4 mt-12'>
        <Loading />
      </div>
    </div>
  );
}

export default function Loading({ size }: { size?: 'small' | 'tiny' }) {
  return <div className={classNames(styles.loader, size ? styles[size] : '')} />;
}
