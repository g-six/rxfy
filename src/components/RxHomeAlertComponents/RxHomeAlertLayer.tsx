'use client';

import { classNames } from '@/_utilities/html-helper';
import React from 'react';

import styles from './RxHomeAlertLayer.module.scss';
import rxfyHomeAlertStep2 from './rxfyHomeAlertStep2';
import rxfyHomeAlertStep1 from './rxfyHomeAlertStep1';
import formReducer from './RxHomeAlertReducer';
import { Transition } from '@headlessui/react';

type RxHomeAlertLayerProps = {
  className: string;
  children: React.ReactNode;
};
export function RxHomeAlertComponents(children: React.ReactNode) {
  const [state, dispatch] = React.useReducer(formReducer, {
    form_1: true,
    form_2: false,
    confirmation: false,
  });

  const rexified_components = (
    children as unknown as React.ReactElement[]
  ).map((comp, idx: number) => {
    const component = React.cloneElement(comp);

    // Rexify Step 1
    if (
      component.props.className.split(' ').includes('ha-step-1')
    ) {
      return (
        <div
          key='step-1'
          className={classNames(
            component.props.className,
            !state.form_1 && styles.HiddenHomeAlertComponent
          )}
        >
          {rxfyHomeAlertStep1(component, {
            onClose: () => {
              dispatch({ type: 'HIDE_FORM_1' });
            },
            onSubmit: () => {
              console.log('submit');
            },
          })}
        </div>
      );
    }

    // Rexify Step 2
    if (
      component.props.className.split(' ').includes('ha-step-2')
    ) {
      return (
        <div
          key='step-2'
          className={classNames(
            component.props.className,
            !state.form_2 && styles.HiddenHomeAlertComponent
          )}
        >
          {rxfyHomeAlertStep2(component, {
            onClose: () => {
              dispatch({ type: 'HIDE_FORM_2' });
            },
            onSubmit: () => {
              console.log('submit');
            },
          })}
        </div>
      );
    }

    // Rexify notification
    if (
      component.props.className.split(' ').includes('ha-step-3')
    ) {
      return (
        <Transition
          key='confirmation'
          show={state.confirmation}
          as={React.Fragment}
          enter='transform ease-out duration-300 transition'
          enterFrom='translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
          enterTo='translate-y-0 opacity-100 sm:translate-x-0'
          leave='transition ease-in duration-100'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          {component}
        </Transition>
      );
    }
    return component;
  });

  return rexified_components;
}

export default function RxHomeAlertLayer(
  props: RxHomeAlertLayerProps
) {
  return (
    <div
      className={classNames(
        props.className,
        styles.RxHomeAlertLayer
      )}
    >
      {RxHomeAlertComponents(props.children)}
    </div>
  );
}
