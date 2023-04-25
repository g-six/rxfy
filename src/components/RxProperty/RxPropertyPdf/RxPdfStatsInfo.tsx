'use client';
import React from 'react';

import { MLSProperty } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';

type ReplacerInfoPdfProps = {
  stats: Record<string, string>;
  wrapperClassName: string;
  keyStr: string;
  valStr: string;
  child: React.ReactElement;
  property: MLSProperty | undefined;
  nodeClassName: string;
};

export default function RxPdfStatsInfo(props: ReplacerInfoPdfProps) {
  const rowTemplate = captureMatchingElements(props.child, [
    {
      elementName: 'statRow',
      searchFn: searchByClasses(['b-statrow']),
    },
  ]);

  const matches = [
    {
      searchFn: searchByClasses([props.wrapperClassName]),
      transformChild: (ch: React.ReactElement) => {
        return React.cloneElement(ch, { ...ch.props }, [
          ...Object.keys(props.stats).map((key, i) => {
            const value = props.property && props.property[key] ? props.property[key] : '';
            return value ? (
              replaceAllTextWithBraces(React.cloneElement(rowTemplate.statRow, { key: i }), {
                [props.keyStr]: props.stats[key],
                [props.valStr]: value,
              })
            ) : (
              <></>
            );
          }),
        ]);
      },
    },
  ];
  return <div className={props.nodeClassName}>{transformMatchingElements(props.child, matches)}</div>;
}
