'use client';
import React from 'react';

import { MLSProperty, PropertyDataModel } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';

type ReplacerInfoPdfProps = {
  stats: Record<string, string>;
  wrapperClassName: string;
  keyStr: string;
  valStr: string;
  child: React.ReactElement;
  property: (PropertyDataModel & { [key: string]: string }) | undefined;
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
            let value = '';
            if (props.property && props.property[key] !== undefined && props.property[key] !== null) {
              if (typeof props.property[key] === 'object') {
                console.log({ line: 35, [key]: props.property[key] });
              } else {
                value = props.property[key];
              }
            }
            if (props.property?.amenities?.data) {
              if (props.stats[key] === 'Outdoor Area') {
                value = '';
                const values: string[] = [];
                props.property.amenities.data.forEach(({ attributes: { name } }) => {
                  if (['Deck', 'Patio'].includes(name)) {
                    values.push(name);
                  }
                });
                value = values.join(' • ');
              }
            }
            if (props.stats[key] === 'Rainscreen') {
              value = '';
              if (props.property?.items_maintained?.data) {
                const values: string[] = [];
                props.property.items_maintained.data.forEach(({ attributes: { name } }) => {
                  values.push(name);
                });
                value = values.join(' • ');
              }
            }
            return value ? (
              replaceAllTextWithBraces(React.cloneElement(rowTemplate.statRow, { key: i }), {
                [props.keyStr]: props.stats[key],
                [props.valStr]: value,
              })
            ) : (
              <React.Fragment key={i}></React.Fragment>
            );
          }),
        ]);
      },
    },
  ];
  return <div className={props.nodeClassName}>{transformMatchingElements(props.child, matches)}</div>;
}
