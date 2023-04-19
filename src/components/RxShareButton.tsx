'use client';
import React from 'react';

type Props = {
  className: string;
  children?: React.ReactElement;
  title: string;
};
export default function RxShareButton(p: Props) {
  const copyLinkToClipboard = async () => {
    try {
      await navigator.share({
        title: p.title,
        text: p.title,
        url: location.href,
      });
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <button
      className={p.className}
      onClick={() => {
        copyLinkToClipboard();
      }}
    >
      {p.children || ' '}
    </button>
  );
}
