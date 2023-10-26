import { Children, KeyboardEvent, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';
import { AgentData, AgentMetatags, AgentMetatagsInput } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import Cookie from 'js-cookie';
import SpinningDots from '@/components/Loaders/SpinningDots';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import { Events, NotificationCategory } from '@/hooks/useFormEvent';
import useEvent from '@/hooks/useEvent';
import { TabProps } from './page.types';

function Iterate({
  children,
  ...props
}: {
  children: ReactElement;
  agent: AgentData;
  values: FormValues;
  disabled?: boolean;
  loading?: boolean;
  onChange(evt: KeyboardEvent<HTMLInputElement>): void;
  onSubmit(evt: MouseEvent<HTMLButtonElement>): void;
}) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub } = c.props;
        return cloneElement(c, {}, <Iterate {...props}>{sub}</Iterate>);
      } else if (c.type === 'input') {
        let { instagram_url, facebook_url, linkedin_url } = props.values;

        switch (c.props.placeholder?.toLowerCase()) {
          case 'instagram link':
            return cloneElement(c, {
              name: 'instagram_url',
              defaultValue: instagram_url,
              onChange: props.onChange,
            });
            break;
          case 'facebook link':
            return cloneElement(c, {
              name: 'facebook_url',
              defaultValue: facebook_url,
              onChange: props.onChange,
            });
            break;
          case 'linkedin link':
            return cloneElement(c, {
              name: 'linkedin_url',
              defaultValue: linkedin_url,
              onChange: props.onChange,
            });
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
  id?: number;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
}
export default function TabSocialLinks({ children, ...props }: TabProps) {
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [agent, setAgent] = useState<AgentData & { phone_number: string }>();
  const [data, setData] = useState<FormValues>({});
  const [is_loading, toggleLoading] = useState<boolean>(false);

  useEffect(() => {
    if (is_loading && data) {
      const session_key = Cookie.get('session_key');

      if (session_key) {
        updateAccount(session_key, { metatags: data as unknown as { [k: string]: unknown } }, true)
          .then(updates => {
            props.onContentUpdate({
              ...props.agent,
              metatags: {
                ...props.agent.metatags,
                ...data,
              },
            });
            notify({
              timeout: 10000,
              category: NotificationCategory.SUCCESS,
              message: 'Great, social media links all set!',
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
    let {
      metatags: { linkedin_url, instagram_url, facebook_url },
    } = props.agent;
    facebook_url = facebook_url || '';
    instagram_url = instagram_url || '';
    linkedin_url = linkedin_url || '';
    setData({
      id: props.agent.metatags.id ? Number(props.agent.metatags.id) : undefined,
      linkedin_url,
      instagram_url,
      facebook_url,
    });
  }, []);

  return (
    <>
      <Iterate
        {...props}
        agent={props.agent}
        values={data}
        onChange={evt => {
          setData({
            ...data,
            [evt.currentTarget.name]: evt.currentTarget.value,
          });
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
