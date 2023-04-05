'use client';

import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { NotificationCategory } from '@/_typings/events';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import axios, { AxiosResponse } from 'axios';
import React from 'react';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { RxPassword } from '../RxPassword';
import { RxTextInput } from '../RxTextInput';

type RxSignupPageProps = {
  type: string;
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

      return <input {...child_node.props} className={[child_node.props.className || '', 'rexified'].join(' ')} />;
    } else if (child.props && child.props.children)
      return React.cloneElement(
        {
          ...child,
        },
        {
          ...child.props,
          // Wrap grandchildren too
          children: <RxPageIterator {...props}>{child.props.children}</RxPageIterator>,
        },
      );
    else return child;
  });

  return <>{wrappedChildren}</>;
}

const gql = `mutation SignUp ($data: UsersPermissionsUserInput!) {
  createUsersPermissionsUser(
    data: $data
  ) {
    data {
      id
      attributes {
        username
        email
        full_name
      }
    }
  }
}`;

export function RxSignupPage(props: RxSignupPageProps) {
  const { data, fireEvent } = useEvent(Events.SignUp);
  const { data: notification, fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_processing, processing] = React.useState(false);
  const form_data: EventsData & {
    email?: string;
    password?: string;
    full_name?: string;
  } = data;

  React.useEffect(() => {
    if (is_processing) {
      processing(false);
      axios
        .post(
          `${process.env.NEXT_PUBLIC_CMS_GRAPHQL_URL}`,
          {
            query: gql,
            variables: {
              data: {
                username: form_data.email,
                email: form_data.email,
                password: form_data.password,
                full_name: form_data.full_name,
                role: 2, // Public,
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_CMS_API_KEY as string}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .then((response: AxiosResponse<SignUpResponse>) => {
          let error = '';
          let confirmation = '';
          if (response.data.errors) {
            response.data.errors.forEach(({ message, extensions }) => {
              if (extensions) {
                if (extensions.error?.details?.errors) {
                  extensions.error?.details?.errors.forEach(({ path, message }) => {
                    error = `${error}${message}\n`;
                  });
                } else if (extensions.error?.message) {
                  error = `${extensions.error.message}\n`;
                }
              }
            });
          } else {
            const { createUsersPermissionsUser: user } = response.data.data;
            confirmation = 'Thanks for signing up!';
          }
          if (error) {
            notify({
              category: NotificationCategory.Error,
              message: error,
            });
          } else if (confirmation) {
            notify({
              category: NotificationCategory.Success,
              message: confirmation,
            });
          }
        })
        .catch(signup_error => {
          console.log('Errors in RxSignupPage');
          console.log(JSON.stringify(signup_error, null, 4));
        })
        .finally(() => {
          fireEvent({
            ...data,
            clicked: undefined,
          });
        });
    }
  }, [is_processing]);

  React.useEffect(() => {
    if (data.clicked === 'signup-button') {
      processing(true);
    }
  }, [data]);

  return (
    <form
      id='rx-login-page'
      data-wf-user-form-type={WEBFLOW_NODE_SELECTOR.SIGNUP}
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
