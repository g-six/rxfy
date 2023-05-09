import React from 'react';
type Props = {
  className?: string;
  children: React.ReactElement[];
  placeholder: string;
  value: string;
};

function ComponentIterator(props: Props) {
  const wrappedChildren = React.Children.map(props.children, child => {
    if (typeof child === 'string') {
      if (child === props.placeholder) {
        return props.value;
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

export default function RxHandlebarElement(p: Props) {
  return React.cloneElement(<div />, {
    ...p,
    children: <ComponentIterator {...p}>{p.children}</ComponentIterator>,
  });
}
