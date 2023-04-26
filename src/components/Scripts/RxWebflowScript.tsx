'use client';

import Script from 'next/script';

type ScriptProps = {
  'script-src': string;
  'script-name': string;
};
export function RxWebflowScript(p: ScriptProps) {
  const onScriptLoad = () => {
    if (p['script-name'].indexOf('jquery') === -1) {
      let start = Date.now();
      const t = setInterval(() => {
        const badge = document.querySelector('.w-webflow-badge');
        if (badge) {
          badge.remove();
          console.log('badge found and removed');
        }
        if (start < Date.now() - 10000) {
          clearInterval(t);
          console.log('Rexifier can now rest from watching that badger!');
        }
      }, 1);
    }
  };

  return (
    <>
      <Script
        src={p['script-src']}
        id={p['script-name']}
        strategy={p['script-name'].indexOf('webflow') >= 0 ? 'lazyOnload' : 'beforeInteractive'}
        onLoad={onScriptLoad}
      />
    </>
  );
}
