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

export default function Loading() {
  return <div className={styles.loader} />;
}
