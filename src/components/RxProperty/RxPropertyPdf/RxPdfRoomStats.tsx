'use client';
import React from 'react';

import { PropertyDataModel } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';

type ReplacerRoomsPdfProps = {
  property: (PropertyDataModel & { [key: string]: string }) | undefined;
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
        const rooms = props.property?.room_details?.rooms || [];
        return React.cloneElement(ch, { ...ch.props }, [
          ...rooms.map((room, i) => {
            return replaceAllTextWithBraces(React.cloneElement(rowTemplate.statRow, { key: i }), {
              roomstat: room.level,
              roomtype: room.type,
              roomdim: room.width && room.length ? room.width + ' x ' + room.length : '',
            });
          }),
        ]);
      },
    },
  ];

  return <div className={props.nodeClassName}>{transformMatchingElements(props.child, matches)}</div>;
}
