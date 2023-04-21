import { captureMatchingElements, replaceAllTextWithBraces, tMatch } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';

type Props = {
  child: ReactElement;
  stats: {
    label: string;
    value: string | string[] | number | undefined;
  }[];
  config: {
    label: string;
    value: string;
  };
};

export default function StatBlock({ child, stats, config }: Props) {
  const { title, row } =
    captureMatchingElements(child, [
      { elementName: 'title', searchFn: searchByClasses(['stat-name']) },
      { elementName: 'row', searchFn: searchByClasses(['div-stat-name-and-result']) },
    ]) || {};

  return (
    <>
      {cloneElement(child, {}, [
        title,
        stats.map(stat => {
          return replaceAllTextWithBraces(row, { [config.label]: stat.label, [config.value]: stat.value });
        }),
      ])}
    </>
  );
}
