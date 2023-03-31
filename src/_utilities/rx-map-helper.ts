'use client';

import { cloneElement } from 'react';
import { RxPropertyMapProps } from '@/_typings/maps';

function descreaseBeds() {
  const currentUrl = new URL(window.location.href);
  let num_of_beds = Number(currentUrl.searchParams.get('beds') || '0');
  if (num_of_beds > 1) {
    num_of_beds = num_of_beds - 1;
    currentUrl.searchParams.set('beds', `${num_of_beds}`);
    window.history.pushState({}, `beds=${num_of_beds}`, currentUrl.href);
  }
}

function increaseBeds() {
  const currentUrl = new URL(window.location.href);
  let num_of_beds = Number(currentUrl.searchParams.get('beds') || '0');
  num_of_beds = num_of_beds + 1;
  currentUrl.searchParams.set('beds', `${num_of_beds}`);
  window.history.pushState({}, `beds=${num_of_beds}`, currentUrl.href);
}

export default function rxfyBedsAndBaths({ parentProps, child }: { parentProps: RxPropertyMapProps; child: any }) {
  if (child.props.className && child.props.className?.indexOf('beds-less') >= 0) {
    return cloneElement(child, {
      onClick: () => {
        descreaseBeds();
      },
    });
  }

  if (child.props.className && child.props.className?.indexOf('beds-more') >= 0) {
    return cloneElement(child, {
      onClick: () => {
        increaseBeds();
      },
    });
  }
}
