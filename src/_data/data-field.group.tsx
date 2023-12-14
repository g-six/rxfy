import { Children, ReactElement, cloneElement } from 'react';

interface GroupProps {
  children: ReactElement;
  'data-field-group': string;
}

function Iterator({ children, ...props }: GroupProps) {
  const rexifier = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        let className = attribs.className || '';
        className = className ? `${className} rexified` : 'rexified';
        return cloneElement(
          c,
          {
            className,
          },
          <Iterator {...props}>{sub}</Iterator>,
        );
      }
      return c;
    }
  });
  return <>{rexifier}</>;
}

export default function DataFieldGroup({ children, ...props }: GroupProps) {
  return <Iterator {...props}>{children}</Iterator>;
}
