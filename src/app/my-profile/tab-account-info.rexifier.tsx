import { Children, KeyboardEvent, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import Cookie from 'js-cookie';
import SpinningDots from '@/components/Loaders/SpinningDots';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import { TabProps } from './page.types';

function Iterate({
  children,
  ...props
}: {
  children: ReactElement;
  agent: AgentData & { phone_number: string };
  disabled?: boolean;
  loading?: boolean;
  onChange(evt: KeyboardEvent<HTMLInputElement>): void;
  onSubmit(evt: MouseEvent<HTMLButtonElement>): void;
}) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        return cloneElement(c, {}, <Iterate {...props}>{sub}</Iterate>);
      } else if (c.type === 'input') {
        let { first_name, last_name } = props.agent;
        if ((!first_name || !last_name) && props.agent.full_name) {
          const words = props.agent.full_name.split(' ');
          if (!first_name) {
            first_name = words[0] as string;
          }

          if (words.length > 1 && !last_name) {
            last_name = words.slice(1).join(' ');
          }
        }

        if (c.props['data-input'])
          switch (c.props['data-input']) {
            case 'first_name':
              return cloneElement(c, {
                name: c.props['data-input'],
                value: first_name,
                onChange: props.onChange,
              });
              break;
            case 'last_name':
              return cloneElement(c, {
                name: c.props['data-input'],
                value: last_name,
                onChange: props.onChange,
              });
            default:
              const kv = props.agent as unknown as { [k: string]: string };
              return cloneElement(c, {
                name: c.props['data-input'],
                value: kv[c.props['data-input']],
                onChange: props.onChange,
              });
              //   break;
              // case 'enter email':
              //   return cloneElement(c, {
              //     name: 'email',
              //     value: props.agent.email || '',
              //     onChange: props.onChange,
              //   });
              //   break;
              // case 'phone number':
              //   return cloneElement(c, {
              //     name: 'phone_number',
              //     value: props.agent.phone_number || '',
              //     onChange: props.onChange,
              //   });
              //   break;
              // case 'enter your paragon id':
              //   return cloneElement(c, {
              //     name: 'agent_id',
              //     value: props.agent.agent_id || '',
              //     onChange: props.onChange,
              //   });
              break;
          }
      } else if (typeof c.props.children === 'string' && ['a', 'button'].includes(c.type as string)) {
        const text = c.props.children as string;
        if (text.toLowerCase() === 'save') {
          return cloneElement(
            <button type='button' disabled={props.loading || props.disabled} />,
            {
              ...c.props,
              className: classNames(c.props.className, 'disabled:opacity-50'),
              href: undefined,
              onClick: props.onSubmit,
            },
            <>
              {props.loading && <SpinningDots className='fill-white mr-2' />}
              {c.props.children}
            </>,
          );
        }
      }
    }
    return c;
  });
  return <>{rexified}</>;
}

interface FormValues {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  agent_id?: string;
}
export default function TabAccountInfo({ children, ...props }: TabProps) {
  const [agent, setAgent] = useState<AgentData & { phone_number: string }>();
  const [data, setData] = useState<FormValues>({});
  const [is_loading, toggleLoading] = useState<boolean>(false);

  useEffect(() => {
    if (is_loading && data) {
      const session_key = Cookie.get('session_key');

      if (session_key) {
        updateAccount(session_key, data, true)
          .then(response => {
            let { first_name, last_name, full_name, email, phone_number } = response as {
              [k: string]: string;
            };
            props.onContentUpdate({
              ...props.agent,
              first_name: first_name || props.agent.first_name,
              last_name: last_name || props.agent.last_name,
              full_name: full_name || props.agent.full_name,
              email: email || props.agent.email,
              phone_number: phone_number || props.agent.phone_number,
            });
          })
          .finally(() => {
            toggleLoading(false);
          });
      }
    }
  }, [is_loading]);

  useEffect(() => {
    setAgent(props.agent);
    const { agent_id, first_name, last_name, email, phone_number } = props.agent;
    setData({
      agent_id,
      first_name,
      last_name,
      email,
    });
  }, []);

  return (
    <>
      <Iterate
        {...props}
        agent={{
          ...props.agent,
          ...data,
        }}
        onChange={evt => {
          let { first_name, last_name } = data;
          let full_name = props.agent.full_name;
          if (['first_name', 'last_name'].includes(evt.currentTarget.name)) {
            full_name = [
              evt.currentTarget.name === 'first_name' ? evt.currentTarget.value : first_name,
              evt.currentTarget.name === 'last_name' ? evt.currentTarget.value : last_name,
            ].join(' ');
            setData({
              ...data,
              full_name,
              [evt.currentTarget.name]: evt.currentTarget.value,
            });
          } else {
            setData({
              ...data,
              [evt.currentTarget.name]: evt.currentTarget.value,
            });
          }
        }}
        onSubmit={evt => {
          if (
            Object.keys(data).filter(k => {
              const a = props.agent as unknown as {
                [k: string]: string;
              };
              const b = data as unknown as {
                [k: string]: string;
              };
              return a[k] !== b[k];
            }).length
          ) {
            // Has changes
            toggleLoading(true);
          }
        }}
        disabled={
          Object.keys(data).filter(k => {
            const a = props.agent as unknown as {
              [k: string]: string;
            };
            const b = data as unknown as {
              [k: string]: string;
            };
            return a[k] !== b[k];
          }).length === 0
        }
        loading={is_loading}
      >
        {children}
      </Iterate>
    </>
  );
}
