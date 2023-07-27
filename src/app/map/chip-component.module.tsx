import React from 'react';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';
import { classNames } from '@/_utilities/html-helper';

export default function ChipComponent({
  children,
  onSelectType,
  active,
  ...props
}: {
  children: React.ReactElement;
  onSelectType(evt: React.SyntheticEvent): void;
  active?: string[];
}) {
  const [preload, setPreload] = React.useState<{ [k: string]: string }>();
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      return (
        <>
          {convertDivsToSpans(
            React.cloneElement(c, {
              ...c.props,
              className: classNames(c.props.className, preload?.['data-selected'] !== undefined && 'w--redirected-checked'),
            }),
          )}
        </>
      );
    }
    return c;
  });

  React.useEffect(() => {
    if (active && active.length) {
      React.Children.map(children, c => {
        if (typeof c.props?.children === 'string') {
          setPreload(
            active.includes(c.props.children)
              ? {
                  'data-selected': '',
                }
              : {},
          );
        }
      });
    } else {
      setPreload({});
    }
  }, [active]);

  React.useEffect(() => {
    if (active && active.length) {
      React.Children.map(children, c => {
        if (typeof c.props?.children === 'string' && active.includes(c.props.children)) {
          setPreload({
            'data-selected': '',
          });
        }
      });
    }
  }, []);

  return (
    <label
      {...props}
      {...preload}
      onClick={(evt: React.SyntheticEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        const toggle_span = evt.currentTarget.querySelector('.w-checkbox-input');
        if (toggle_span) {
          evt.currentTarget.setAttribute('data-value', evt.currentTarget.textContent || '');
          if (toggle_span.classList.contains('w--redirected-checked')) {
            evt.currentTarget.removeAttribute('data-selected');
            toggle_span.classList.remove('w--redirected-checked');
          } else {
            evt.currentTarget.setAttribute('data-selected', '');
            toggle_span.classList.add('w--redirected-checked');
          }
        }
        onSelectType(evt);
      }}
    >
      {Wrapped}
    </label>
  );
}
