import { replaceAllTextWithBraces } from '@/_helpers/dom-manipulators';
import React, { ReactElement } from 'react';

type Props = {
  className: string;
  value: string;
  label: string;
  onClick: (e: React.SyntheticEvent) => void;
};

export default function FiltersTabsItem({ label, ...props }: Props) {
  return <div {...props}>{label}</div>;
}
