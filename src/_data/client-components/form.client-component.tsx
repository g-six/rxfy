'use client';
import useFormEvent, { Events } from '@/hooks/useFormEvent';
import { ChangeEvent, Children, ReactElement, cloneElement, useEffect } from 'react';
import DataAction from '../data-action';
import DataShowOn from '../data-show.client-component';

interface FormProps {
  name?: string;
  method?: string;
  data: { [k: string]: unknown };
  contexts?: { [k: string]: { [k: string]: unknown } };
  'data-form': string;
  className: string;
  children: ReactElement;
}

function FormIterator({ children, data, ...props }: FormProps & { onChange(name: string, value: string): void }) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      const { className, ...attribs } = c.props;
      if (attribs['data-show-on']) {
        return <DataShowOn {...attribs} element={c} />;
      } else if (attribs['data-action']) {
        return (
          <DataAction {...attribs} {...props} data={data}>
            {c}
          </DataAction>
        );
      } else if (attribs['data-input']) {
        let field = attribs['data-input'] || '';

        return cloneElement(
          c.type === 'textarea' ? (
            <textarea
              className={className}
              onChange={(evt: ChangeEvent<HTMLTextAreaElement>) => {
                props.onChange(evt.currentTarget.name, evt.currentTarget.value);
              }}
            />
          ) : (
            <input
              type={field.includes('password') ? 'password' : 'text'}
              onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                props.onChange(evt.currentTarget.name, evt.currentTarget.value);
              }}
            />
          ),
          {
            ...attribs,
            className,
            'data-rexifier': 'form.client-component.FormIterator',
            name: field,
          },
        );
      } else if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(
          c,
          { 'data-rexifier': 'form.client-component.FormIterator' },
          <FormIterator {...props} data={data}>
            {c.props.children}
          </FormIterator>,
        );
      }
    }
    return c;
  });

  return <>{rexified}</>;
}
export default function FormComponent({ children, action, data, contexts, ...props }: FormProps & { action?: string }) {
  const form_action = (props['data-form'] || action?.split('/').pop()) as unknown as Events;

  const form = useFormEvent(form_action || '');

  return cloneElement(
    <div data-rexifier='form.client-component.FormComponent' data-form={form_action} />,
    props,
    <FormIterator
      {...props}
      data={data}
      contexts={contexts}
      onChange={(name: string, value: string) => {
        form.fireEvent({
          [name]: value,
        });
      }}
    >
      {children}
    </FormIterator>,
  );
}
