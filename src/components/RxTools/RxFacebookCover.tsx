'use client';
import React from 'react';
import html2canvas from 'html2canvas';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { downloadFromUrl } from '@/_helpers/functions';

import RxFacebookCoverContent from '@/components/RxTools/RxFacebookCoverContent';

export default function RxFacebookCover({ nodes, agent }: ReplacerPageProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['facebook-cover']),
      transformChild: (child: React.ReactElement) => {
        return (
          <div ref={ref}>
            <RxFacebookCoverContent agent={agent} nodes={[child]} nodeClassName={child.props.className} nodeProps={child.props} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['download-fb-cover']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          onClick: onDownload,
        });
      },
    },
  ];

  const onDownload = React.useCallback(() => {
    if (ref && ref.current && agent) {
      html2canvas(ref.current as HTMLElement, { allowTaint: true, useCORS: true }).then((canvas: HTMLCanvasElement) => {
        canvas.getContext('2d');
        const canvasImage = canvas.toDataURL('image/png');
        downloadFromUrl(canvasImage);
      });
    }
  }, [ref, agent]);

  return <>{transformMatchingElements(nodes, matches)}</>;
}
