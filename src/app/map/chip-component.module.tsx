import React from 'react';
import { convertDivsToSpans } from '@/_replacers/DivToSpan';

export default function ChipComponent({ children, onSelectType, ...props }: { children: React.ReactElement; onSelectType(evt: React.SyntheticEvent): void }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      return <>{convertDivsToSpans(c)}</>;
    }
    return c;
  });
  return (
    <label
      {...props}
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
