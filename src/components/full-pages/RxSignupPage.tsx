'use client';

import { AxiosError } from 'axios';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { NotificationCategory } from '@/_typings/events';
import React from 'react';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { RxPassword } from '../RxPassword';
import { RxTextInput } from '../RxTextInput';
import { RxCheckBox } from '../RxCheckBox';
import { agentSignUp, signUp } from '@/_utilities/api-calls/call-signup';
import { AgentSignUpInput } from '@/_typings/agent';

type RxSignupPageProps = {
  type: string;
  agent: number;
  logo?: string;
  children: React.ReactElement;
  className: string;
};

export function RxPageIterator(props: RxSignupPageProps) {
  const wrappedChildren = React.Children.map(props.children, child => {
    const child_node = child as React.ReactElement;

    if (child_node.type === 'input') {
      if (child_node.props.type === 'submit') {
        return (
          <RxButton {...child_node.props} rx-event={Events.SignUp} id='signup-button'>
            {child_node.props.value}
          </RxButton>
        );
      }
      if (child_node.props.className.split(' ').includes('txt-email')) {
        return <RxEmail {...child_node.props} rx-event={Events.SignUp} name='email' />;
      }
      if (child_node.props.className.split(' ').includes('txt-password')) {
        return <RxPassword {...child_node.props} rx-event={Events.SignUp} name='password' />;
      }
      if (child_node.props.className.split(' ').includes('txt-name')) {
        return <RxTextInput {...child_node.props} rx-event={Events.SignUp} name='full_name' />;
      }
      if (child_node.props.className.split(' ').includes('txt-agentid')) {
        return <RxTextInput {...child_node.props} rx-event={Events.SignUp} name='agent_id' />;
      }
      if (child_node.props.id === 'wf-sign-up-accept-communications') {
        return <RxCheckBox {...child_node.props} rx-event={Events.SignUp} name='yes_to_marketing' />;
      }

      return <input {...child_node.props} className={[child_node.props.className || '', 'rexified'].join(' ')} />;
    } else if (child.props && child.props.children) {
      let style;
      if (child_node.props.className && child_node.props.className.split(' ').includes('w-users-userformheader') && props.logo) {
        style = {
          backgroundImage: `url(${props.logo})`,
          backgroundSize: '4rem',
        };
      }
      return React.cloneElement(
        {
          ...child,
        },
        {
          ...child.props,
          className:
            props.logo && child_node.props.className && child_node.props.className.split(' ').includes('w-users-userformheader')
              ? `${child.props.className} rexified pt-12 bg-center bg-no-repeat`
              : child.props.className || '',
          style,
          // Wrap grandchildren too
          children: <RxPageIterator {...props}>{child.props.children}</RxPageIterator>,
        },
      );
    } else return child;
  });

  return <>{wrappedChildren}</>;
}

function validRealtorInput(data: { email?: string; password?: string; full_name?: string; agent_id?: number; yes_to_marketing?: boolean; phone?: string }): {
  data?: AgentSignUpInput;
  errors?: {
    agent_id?: string;
    email?: string;
    password?: string;
    phone?: string;
    full_name?: string;
  };
  error?: string;
} {
  let error = '';

  if (!data.agent_id) {
    error = `${error}\nA valid agent id (e.g. Paragon) is required for realtor sign ups`;
  }
  if (!data.email) {
    error = `${error}\nA valid email`;
  }
  if (!data.full_name) {
    error = `${error}\nYour full name`;
  }
  if (!data.phone) {
    error = `${error}\nYour phone number`;
  }
  if (!data.password) {
    error = `${error}\nA hard-to-guess password with at least 10 characters is required`;
  }

  if (error) {
    return { error: `A couple of things we require from a realtor\n\n${error}` };
  }

  return {
    data: {
      ...data,
    } as unknown as {
      email: string;
      password: string;
      full_name: string;
      yes_to_marketing: boolean;
      agent_id: string;
      phone: string;
    },
  };
}

function validInput(data: { email?: string; password?: string; full_name?: string; agent_id?: number; yes_to_marketing?: boolean }): {
  data?: {
    email: string;
    password: string;
    full_name: string;
    yes_to_marketing: boolean;
  };
  errors?: {
    email?: string;
    password?: string;
    full_name?: string;
  };
  error?: string;
} {
  let error = '';

  if (!data.email) {
    error = `${error}\nA valid email is required`;
  }
  if (!data.password) {
    error = `${error}\nA hard-to-guess password with at least 10 characters is required`;
  }
  if (!data.full_name) {
    error = `${error}\nYour realtor would need your name`;
  }

  if (error) {
    return { error };
  }

  return {
    data: {
      ...data,
    } as unknown as {
      email: string;
      password: string;
      full_name: string;
      yes_to_marketing: boolean;
    },
  };
}

export function RxSignupPage(props: RxSignupPageProps) {
  const { data, fireEvent } = useEvent(Events.SignUp);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_processing, processing] = React.useState(false);
  const form_data = data as unknown as {
    email?: string;
    password?: string;
    full_name?: string;
    yes_to_marketing?: boolean;
  };

  const submitForm = () => {
    const is_agent = (props.className || '').split(' ').includes('use-agent');
    const { data: valid_data, error } = is_agent ? validRealtorInput(form_data) : validInput(form_data);
    if (error) {
      notify({
        category: NotificationCategory.ERROR,
        message: error,
      });
    } else if (valid_data) {
      if (is_agent)
        agentSignUp(valid_data as AgentSignUpInput)
          .then(response => {
            if (response.error) {
              notify({
                category: NotificationCategory.ERROR,
                message: response.error,
              });
            } else {
              notify({
                category: NotificationCategory.SUCCESS,
                message: "Great, you're all signed up! We've sent you an verification email with a one-time account activation link.",
              });
            }
            // setTimeout(() => {
            //   location.href = '/log-in';
            // }, 1400);
          })
          .catch((e: AxiosError) => {
            if (e.response && e.response.data) {
              const { error } = e.response.data as { error: string };
              if (error) {
                notify({
                  category: NotificationCategory.ERROR,
                  message: error,
                });
              }
            }
          });
      else
        signUp(
          {
            id: Number(props.agent),
            email: (props.className || '').split(' ').includes('use-agent') ? valid_data.email : undefined,
            logo: props.logo,
          },
          valid_data,
        )
          .then(response => {
            notify({
              category: NotificationCategory.SUCCESS,
              message: "Great, you're all set! Forwarding you to our login portal.",
            });
            setTimeout(() => {
              location.href = '/log-in';
            }, 1400);
          })
          .catch((e: AxiosError) => {
            if (e.response && e.response.data) {
              const { error } = e.response.data as { error: string };
              if (error) {
                notify({
                  category: NotificationCategory.ERROR,
                  message: error,
                });
              }
            }
          });
    }
  };

  React.useEffect(() => {
    if (is_processing) {
      processing(false);
      fireEvent({
        ...data,
        clicked: undefined,
      });
      submitForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is_processing]);

  React.useEffect(() => {
    if (data?.clicked === 'signup-button') {
      processing(true);
      fireEvent({
        ...data,
        clicked: undefined,
      });
    }
  }, [data]);

  return (
    <form
      id='rx-signup-page'
      className={props.className}
      onSubmit={e => {
        e.preventDefault();
        fireEvent({
          ...data,
          clicked: 'signup-button',
        });
      }}
    >
      <RxPageIterator {...props} />
    </form>
  );
}
