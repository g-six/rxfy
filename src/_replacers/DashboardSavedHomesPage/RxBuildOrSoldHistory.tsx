import { captureMatchingElements } from '@/_helpers/dom-manipulators';
import { MLSProperty } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  data: MLSProperty[];
  child: ReactElement;
  type: 'building' | 'sold-history';
};

export default function RxBuildOrSoldHistory({ child, data, type }: Props) {
  const { h, sub, buildingRow, soldRow } = captureMatchingElements(child, [
    { searchFn: searchByClasses(['heading']), elementName: 'h' },
    { searchFn: searchByClasses(['text-block']), elementName: 'sub' },
    { searchFn: searchByClasses(['div-building-units-on-sale']), elementName: 'buildingRow' },
    { searchFn: searchByClasses(['div-sold-history']), elementName: 'soldRow' },
  ]);

  //data.map((p, i) => cloneElement(type === 'building' ? buildingRow : soldRow, { key: `${i}` }))
  return <>{cloneElement(child, {}, [h, sub])}</>;
}
