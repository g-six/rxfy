import React from 'react';

export function convertDivsToSpans(el: React.ReactElement) {
  if (el && el.props?.children && el.type !== 'span' && el.type !== 'svg')
    return (
      <span {...el.props} className={el.props?.className || '' + ' rexified converted-div'}>
        {React.Children.map(el.props.children, convertDivsToSpans)}
      </span>
    );
  return el;
}
