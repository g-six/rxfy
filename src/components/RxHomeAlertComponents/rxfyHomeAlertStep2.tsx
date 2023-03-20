import React from 'react';
import { hasClassName } from '@/_utilities/html-helper';
import { EnvelopeIcon } from '@heroicons/react/20/solid';

export default function rxfyHomeAlertStep2(
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
        if (
          hasClassName(
            grandkid.props.className,
            'email-input-field---ha'
          )
        ) {
          const replacement = React.cloneElement(grandkid, {
            ...grandkid.props,
            children: (
              <div className='relative w-full'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center'>
                  <EnvelopeIcon
                    className='h-5 w-5 text-gray-400'
                    aria-hidden='true'
                  />
                </div>
                <input
                  type='email'
                  name='email'
                  id='email'
                  className='peer block w-full border-0 focus:outline-none outline-none focus:ring-0 ring-transparent pl-7 text-gray-900 sm:text-sm sm:leading-6'
                  placeholder='you@example.com'
                />
              </div>
            ),
          });
          return replacement;
        }

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
