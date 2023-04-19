'use client';
import React, { ReactElement } from 'react';

type Props = {
  child: ReactElement;
};

export default function IndividualPage({ child }: Props) {
  console.log('rerender  individual page');
  return <div>hey</div>;
}
