'use client';

import axios, { AxiosResponse } from 'axios';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { NotificationCategory } from '@/_typings/events';
import React from 'react';
import { RxButton } from '../RxButton';
import { RxEmail } from '../RxEmail';
import { RxPassword } from '../RxPassword';
import { RxTextInput } from '../RxTextInput';
import { hashPassword } from '@/_utilities/encryption-helper';

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

const gql = `mutation SignUp ($data: CustomerInput!) {
  createCustomer(data: $data) {
    data {
      id
      attributes {
        email
        full_name
        agents {
          data {
            id
            attributes {
              full_name
            }
          }
        }
      }
    }
  }
}`;

function validInput(data: { email?: string; password?: string; full_name?: string; agent_id?: number }): {
  data?: {
    email: string;
    password: string;
    full_name: string;
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
    },
  };
}

export function RxSignupPage(props: RxSignupPageProps) {
  const { data, fireEvent } = useEvent(Events.SignUp);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_processing, processing] = React.useState(false);
  const form_data: EventsData & {
    email?: string;
    password?: string;
    full_name?: string;
  } = data;

  const submitForm = () => {
    const { data: valid_data, error } = validInput(form_data);

    if (error) {
      notify({
        category: NotificationCategory.Error,
        message: error,
      });
    } else if (valid_data)
      axios
        .post(
          `${process.env.NEXT_PUBLIC_CMS_GRAPHQL_URL}`,
          {
            query: gql,
            variables: {
              data: {
                email: valid_data.email,
                encrypted_password: hashPassword(valid_data.password),
                full_name: valid_data.full_name,
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
          let api_error = '';
          let confirmation = '';
          if (response.data.errors) {
            response.data.errors.forEach(({ message, extensions }) => {
              if (extensions) {
                if (extensions.error?.details?.errors) {
                  extensions.error?.details?.errors.forEach(({ path, message }) => {
                    if (path.includes('email')) {
                      api_error = `${api_error}Email is either invalid or already taken\n`;
                    } else {
                      api_error = `${api_error}${message}\n`;
                    }
                  });
                } else if (extensions.error?.message) {
                  api_error = `${extensions.error.message}\n`;
                } else if (message) {
                  api_error = `${message}\n`;
                }
              }
            });
          } else {
            const { createCustomer: user } = response.data.data;
            if (user) {
              fireEvent({});
              console.log({ user });
              confirmation = 'Thanks for signing up!';
            }
          }
          if (api_error) {
            notify({
              category: NotificationCategory.Error,
              message: api_error,
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
        });
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
