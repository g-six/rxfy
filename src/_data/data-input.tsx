'use client';
import useFormEvent, { Events } from '@/hooks/useFormEvent';
import { ChangeEvent, Children, ReactElement, cloneElement, useEffect, useState } from 'react';
const FILE = 'data-input.tsx';
function Iterator({
  children,
  data,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  onChange(name: string, value: string): void;
  'fallback-context': string;
  'data-input-type'?: string;
}) {
  const rexifier = Children.map(children, c => {
    if (c.props) {
      const { children: sub, ...attribs } = c.props;
      let className = attribs.className || '';
      className = className ? `${className} rexified` : 'rexified';

      if (data) {
        let field = attribs['data-input'] || '';
        if (field) {
          return cloneElement(
            <input
              type={props['data-input-type'] || (field.includes('password') ? 'password' : 'text')}
              data-rexifier={FILE}
              onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                props.onChange(evt.currentTarget.name, evt.currentTarget.value);
              }}
            />,
            {
              ...attribs,
              className,
              name: field,
            },
          );
        }
      }

      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(
          c,
          {
            className,
          },
          <Iterator data={data} {...props}>
            {sub}
          </Iterator>,
        );
      }

      return c;
    }
  });
  return <>{rexifier}</>;
}

export default function DataInputAtom({
  children,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
  'data-form': string;
  'data-input-type'?: string;
}) {
  const [is_ready, toggleReady] = useState(false);
  const form = useFormEvent(props['data-form'] as unknown as Events);

  console.log(FILE, props['data-form']);
  useEffect(() => {
    toggleReady(true);
  }, []);

  return is_ready ? (
    <Iterator
      {...props}
      onChange={(name: string, value: string) => {
        form.fireEvent({
          [name]: value,
        });
      }}
    >
      {children}
    </Iterator>
  ) : (
    children
  );
}
