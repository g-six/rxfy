'use client';
import React from 'react';

type Props = {
  className?: string;
  src: string;
};
export default function RxThemePreview(p: Props) {
  const [src, setSrc] = React.useState('');
  React.useEffect(() => {
    if (p.src) {
      setSrc(p.src);
    }
  }, []);
  return p.src ? <iframe className={p.className || ''} src={src} /> : <div className={p.className || ''}>{p.src}</div>;
}
