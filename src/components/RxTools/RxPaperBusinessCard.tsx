'use client';
import React from 'react';
import html2canvas from 'html2canvas';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import rendererPdf from '@/_helpers/pdf-renderer';

import RxPaperBusinessCardFront from '@/components/RxTools/RxPaperBusinessCardFront';
import RxPaperBusinessCardBack from '@/components/RxTools/RxPaperBusinessCardBack';

export default function RxPaperBusinessCard({ nodes, agent }: ReplacerPageProps) {
  const refFront = React.useRef<HTMLDivElement>(null);
  const refBack = React.useRef<HTMLDivElement>(null);

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['card-b']),
      transformChild: (child: React.ReactElement) => {
        return (
          <div ref={refFront}>
            <RxPaperBusinessCardFront agent={agent} nodes={[child]} nodeClassName={child.props.className} nodeProps={child.props} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['card-a']),
      transformChild: (child: React.ReactElement) => {
        return (
          <div ref={refBack}>
            <RxPaperBusinessCardBack agent={agent} nodes={[child]} nodeClassName={child.props.className} nodeProps={child.props} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['order-button']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          onClick: onDownload,
        });
      },
    },
  ];

  const onDownload = React.useCallback(() => {
    if (refFront?.current && refBack?.current) {
      const promises = Array.from([refFront.current, refBack.current])
        .map(el => el as HTMLElement)
        .map(el => {
          //el.style.width = pdfSize.width + 'px';
          //el.style.height = pdfSize.height + 'px';
          return html2canvas(el, { allowTaint: true });
        });
      Promise.all(promises).then(pagesAsCanvas => {
        rendererPdf({ images: pagesAsCanvas, name: 'BusinessCard', inWindow: true });
      });
    }
  }, [refFront, refBack]);

  return <>{transformMatchingElements(nodes, matches)}</>;
}
