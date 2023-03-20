import React from 'react';
import { hasClassName } from '@/_utilities/html-helper';

export default function rxfyHomeAlertStep1(
  component: React.ReactElement,
  eventHandlers: {
    onClose: () => void;
    onSubmit: () => void;
  }
) {
  return React.cloneElement(component, {
    ...component.props,
    children: component.props.children.map(
      (grandkid: React.ReactElement) => {
        if (hasClassName(grandkid.props.className, 'cta')) {
          const buttons: React.ReactElement[] =
            grandkid.props.children.map(
              (button: React.ReactElement) => {
                return (
                  <button
                    key={button.props.className}
                    type='button'
                    className={button.props.className}
                    onClick={() => {
                      hasClassName(button.props.className, 'white')
                        ? eventHandlers.onClose()
                        : eventHandlers.onSubmit();
                    }}
                  >
                    {button.props.children}
                  </button>
                );
              }
            );

          return <>{buttons}</>;
        }
        return grandkid;
      }
    ),
  });
}
