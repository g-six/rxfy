import React from 'react';
import RxHandlebarElement from '../RxHandlebarElement';

type Props = {
  className?: string;
  children: React.ReactElement[];
  values: {
    [key: string]: string;
  };
};

function ComponentIterator(props: Props) {
  const wrappedChildren = React.Children.map(props.children, child => {
    if (typeof child === 'string') {
      if (Object.keys(props.values).includes(child)) {
        return props.values[child];
      }
      return child;
    } else if (child.props) {
      return React.cloneElement(
        {
          ...child,
        },
        {
          ...child.props,
          // Wrap grandchildren too
          children: <ComponentIterator {...props}>{child.props.children}</ComponentIterator>,
        },
      );
    }
    return child;
  });

  return <>{wrappedChildren}</>;
}

export default function RxStatsGridWithIcons(p: Props) {
  return (
    <div className={['RxStatsGridWithIcons', p.className || '', 'rexified'].join(' ').trim()}>
      <ComponentIterator {...p}>{p.children}</ComponentIterator>
    </div>
  );
}
