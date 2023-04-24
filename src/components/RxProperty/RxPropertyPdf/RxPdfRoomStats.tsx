'use client';
import React from 'react';

import { MLSProperty } from '@/_typings/property';
import { room_stats } from '@/_utilities/data-helpers/property-page';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';

type ReplacerRoomsPdfProps = {
  property: MLSProperty | undefined;
  child: React.ReactElement;
  nodeClassName: string;
};

export default function RxPdfRoomStats(props: ReplacerRoomsPdfProps) {
  const rowTemplate = captureMatchingElements(props.child, [
    {
      elementName: 'statRow',
      searchFn: searchByClasses(['stat-row-rooms']),
    },
  ]);

  const matches = [
    {
      searchFn: searchByClasses(['rooms-info-rows']),
      transformChild: (ch: React.ReactElement) => {
        return React.cloneElement(ch, { ...ch.props }, [
          ...Object.keys(room_stats).map((key, i) => {
            const roomData = Object.keys(room_stats[key]).reduce((obj, k) => {
              const template = room_stats[key] as Record<string, string>;
              const val = props.property && props.property[key] ? props.property[key] : '';
              return Object.assign({}, obj, { [`${template[k]}`]: val });
            }, {}) as Record<string, string>;
            return replaceAllTextWithBraces(React.cloneElement(rowTemplate.statRow, { key: i }), {
              roomstat: roomData['Level'],
              roomtype: roomData['Type'],
              roomdim: roomData['Dimension1'] && roomData['Dimension2'] ? roomData['Dimension1'] + 'x' + roomData['Dimension2'] : '',
            });
          }),
        ]);
      },
    },
  ];

  return <div className={props.nodeClassName}>{transformMatchingElements(props.child, matches)}</div>;
}
