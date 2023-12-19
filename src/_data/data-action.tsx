'use client';

import { ChangeEvent, Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import useFormEvent, { Events, EventsData } from '@/hooks/useFormEvent';
import { consoler } from '@/_helpers/consoler';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import { sendMessageToRealtor } from '@/_utilities/api-calls/call-realtor';
import { loveHome, unloveByMLSId } from '@/_utilities/api-calls/call-love-home';
import { AgentData } from '@/_typings/agent';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { useRouter } from 'next/navigation';
import { login } from '@/_utilities/api-calls/call-login';
import { signUp } from '@/_utilities/api-calls/call-signup';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import useEvent from '@/hooks/useEvent';

function Iterator({
  children,
  data,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  'context-data'?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  onClick(): void;
  'fallback-context': string;
  'toggle-state': boolean;
}) {
  const rexifier = Children.map(children, c => {
    if (c.props) {
      const { children: sub, ...attribs } = c.props;
      let className = attribs.className || '';
      className = className ? `${className} rexified` : 'rexified';

      if (data) {
        let action = attribs['data-action'] || '';

        if (action) {
          return cloneElement(c.type === 'input' ? <button type='button' /> : c, {
            ...attribs,
            className,
            children: sub ? (
              typeof sub !== 'string' ? (
                <Iterator data={data} {...props}>
                  {sub}
                </Iterator>
              ) : (
                sub
              )
            ) : (
              <span>{c.props.value}</span> || undefined
            ),
            onClick: () => {
              props.onClick();
            },
          });
        }
      }

      if (c.props['data-off-label'] && c.props['data-on-label']) {
        return cloneElement(c, {}, props['toggle-state'] ? c.props['data-on-label'] : c.props['data-off-label']);
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
    return c;
  });
  return <>{rexifier}</>;
}

export default function DataAction({
  children,
  ...props
}: {
  children: ReactElement;
  data: { [k: string]: unknown };
  'context-data'?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
  'data-action': string;
  'data-modal'?: string;
  'data-context': string;
}) {
  const router = useRouter();
  const context = props['data-context'] || props['fallback-context'];
  const [is_ready, toggleReady] = useState(false);
  let loved = false;

  if (props['data-action'] === 'like') {
    const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
    const { mls_id } = props['context-data'] as {
      [k: string]: string;
    };
    loved = local_loves.includes(mls_id);
  }

  const [state, setState] = useState<{ [k: string]: boolean | number | string }>({
    loved,
  });

  const form = useFormEvent(props['data-action'] as unknown as Events);
  const { fireEvent: showOn } = useFormEvent('data-show-on' as unknown as Events);

  function getState() {
    switch (props['data-action']) {
      case 'like':
        return state.loved as boolean;
      default:
        return false;
    }
  }

  useEffect(() => {}, [state]);

  useEffect(() => {
    toggleReady(true);
  }, []);
  const agent = props.data.agent as AgentData;

  return is_ready ? (
    <Iterator
      {...props}
      toggle-state={getState()}
      onClick={() => {
        ////////
        // Logic to the different supported actions below
        ////////
        switch (props['data-action']) {
          case 'send_message':
            const { email, message, customer_name, phone } = form.data as {
              [k: string]: string;
            };
            if (props.data && email && message && context) {
              const reference = props.data[context] as AgentData;
              const send_to = {
                email: reference.email,
                name: reference.full_name,
              };
              const { origin: host } = new URL(location?.href);
              sendMessageToRealtor({
                email,
                message,
                phone,
                customer_name:
                  customer_name ||
                  email
                    .split('@')[0]
                    .replace(/[^\w\s!?]/g, ' ')
                    .replace(/\d+/g, '')
                    .split(' ')
                    .map(capitalizeFirstLetter)
                    .join(' '),
                send_to,
                host,
              })
                .then(() => {
                  showOn({
                    message: 'send_message_ok',
                  });
                })
                .catch(() => {
                  showOn({
                    message: 'send_message_failed',
                  });
                });
            } else {
              showOn({
                message: 'send_message_failed',
              });
            }
            break;
          case 'like':
            if (props['context-data']) {
              const { mls_id } = props['context-data'] as {
                [k: string]: string;
              };
              if (props.data) {
                const agent = props.data.agent as AgentData;
                if (agent) {
                  const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
                  if (local_loves.includes(mls_id)) {
                    unloveByMLSId(mls_id);
                    setState({ ...state, loved: false });
                  } else {
                    loveHome(mls_id, agent.id);
                    setState({ ...state, loved: true });
                  }
                }
              }
            }
            break;
          case 'facebook':
            if (props['context-data']) {
              const { mls_id } = props['context-data'] as {
                [k: string]: string;
              };
              router.push(`https://www.facebook.com/sharer/sharer.php?u=app.leagent.com/property?mls${mls_id}`);
            }
            break;
          case 'pdf':
            if (props['context-data']) {
              const agent = props.data.agent as AgentData;
              const { mls_id } = props['context-data'] as {
                [k: string]: string;
              };
              router.push(`/api/pdf/mls/${mls_id}?agent=${agent.agent_id}&wf=leagent-webflow-rebuild.webflow.io`);
            }
            break;
          case 'email':
            if (props['context-data']) {
              const { title, mls_id } = props['context-data'] as {
                [k: string]: string;
              };
              router.push(
                `mailto:your@email.here?subject=${title}&body=Check this listing out: https://${
                  agent.domain_name || `${agent.website_theme || 'app'}.leagent.com`
                }/${agent.agent_id}/property?mls=${mls_id}`,
              );
            }
            break;
          case 'login':
            if (props.data.agent) {
              // We're on an agent's website
              const { email, password } = form.data as { email: string; password: string };
              login(email, password, {
                is_agent: context === 'agent',
              })
                .then(results => {
                  showOn({
                    message: 'logged-in',
                  });
                })
                .catch(error => {
                  console.log('data-action.tsx', error);
                });
            }
            break;
          case 'open-popup':
            if (props['data-modal']) {
              form.fireEvent({
                message: `show.${props['data-modal']}`,
              });
              // if (props.data.agent) {
              //   // We're on an agent's website
              //   const { email, password } = form.data as { email: string; password: string };
              //   login(email, password, {
              //     is_agent: props['data-context'] === 'agent',
              //   })
              //     .then(results => {
              //       showOn({
              //         message: 'logged-in',
              //       });
              //     })
              //     .catch(error => {
              //       console.log('data-action.tsx', error);
              //     });
              // }
            }
            break;
          case 'signup':
            if (props.data.agent) {
              // We're on an agent's website
              const { customer_name, email, password } = form.data as { customer_name: string; email: string; password: string };
              const {
                id,
                metatags: { logo_for_dark_bg, logo_for_light_bg },
              } = props.data.agent as AgentData;
              const logo = logo_for_light_bg || logo_for_dark_bg;
              signUp(
                {
                  id,
                  logo: getImageSized(
                    logo_for_light_bg || logo_for_dark_bg || 'https://leagent.com/logo-dark.svg',
                    logo_for_light_bg || logo_for_dark_bg ? 150 : 300,
                  ),
                },
                {
                  full_name: customer_name,
                  email,
                  password,
                  agent_metatag_id: agent.metatags.id,
                },
                {
                  dashboard_url: `${location.origin}/my-profile`,
                },
              )
                .then(results => {
                  showOn({
                    message: 'logged-in',
                  });
                })
                .catch(error => {
                  console.log('data-action.tsx', error);
                });
            }
            break;
          case 'link':
            const copyContent = async () => {
              const { mls_id } = props['context-data'] as {
                [k: string]: string;
              };
              try {
                navigator.clipboard.writeText(
                  `https://${agent.domain_name || `${agent.website_theme || 'app'}.leagent.com`}/${agent.agent_id}/property?mls=${mls_id}`,
                );
              } catch (err) {
                console.error('Failed to copy: ', err);
              }
            };
            copyContent();
            break;
          default:
            consoler('data-action.tsx', `No function handler for: ${props['data-action']}`, props.data);
        }
      }}
    >
      {children}
    </Iterator>
  ) : (
    <>{children}</>
  );
}
