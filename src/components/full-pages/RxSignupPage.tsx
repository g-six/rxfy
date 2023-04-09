'use client';

import axios, { AxiosError, AxiosResponse } from 'axios';
import { MessageRecipient } from '@mailchimp/mailchimp_transactional';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { NotificationCategory } from '@/_typings/events';
import React from 'react';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { RxPassword } from '../RxPassword';
import { RxTextInput } from '../RxTextInput';
import { RxCheckBox } from '../RxCheckBox';

type RxSignupPageProps = {
  type: string;
  agent: number;
  logo?: string;
  children: React.ReactElement;
};

type SignUpResponse = {
  data: {
    createCustomer: {
      data: {
        id: number;
        attributes: {
          email: string;
          full_name: string;
          logo_for_light_bg?: string;
          agents: {
            id: number;
          }[];
        };
      };
    };
  };
  errors?: {
    message: string;
    extensions: {
      error: {
        name: string;
        message?: string;
        details?: {
          errors: {
            path: string[];
            message: string;
          }[];
        };
      };
    };
  }[];
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
    const { data: valid_data, error } = validInput(form_data);

    if (error) {
      notify({
        category: NotificationCategory.Error,
        message: error,
      });
    } else if (valid_data) {
      axios
        .post(
          '/api/sign-up',
          {
            ...valid_data,
            agent: props.agent,
            logo: props.logo,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        .then(response => {
          notify({
            category: NotificationCategory.Success,
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
                category: NotificationCategory.Error,
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
    if (data.clicked === 'signup-button') {
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
