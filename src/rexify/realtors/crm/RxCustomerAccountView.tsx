'use client';
import { AgentData } from '@/_typings/agent';
import { updateClient } from '@/_utilities/api-calls/call-clients';
import { emailPasswordReset } from '@/_utilities/api-calls/call-session';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import { classNames } from '@/_utilities/html-helper';
import BirthdayInput from '@/components/Birthday/birthday.input';
import styles from '@/rexify/dynamic-styles.module.scss';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import { AxiosError } from 'axios';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type Props = {
  className?: string;
  children: React.ReactElement;
  onReset?(): void;
  onSubmit?(): void;
  emailMagicLink(): void;
  'agent-data': AgentData;
};

function CleanAnchor(p: Props & { href: string; disabled?: boolean }) {
  const Wrapped = React.Children.map(p.children, child => {
    switch (child.type) {
      case 'div':
        return (
          <span className={child.props.className} id={child.props.id}>
            {child.props.children}
          </span>
        );
    }
    return child;
  });
  if (p.className?.includes('primary'))
    return (
      <button
        className={p.className}
        type='button'
        disabled={p.disabled}
        onClick={() => {
          if (p.onSubmit) p.onSubmit();
          else console.warn('RxCustomerAccountView: No submit handler specified');
        }}
      >
        {Wrapped}
      </button>
    );

  return (
    <button
      className={p.className + ' rexified RxCustomerAccountView-CleanAnchor-secondary'}
      type='reset'
      onClick={() => {
        if (typeof p.children === 'string') {
          if (`${p.children}`.includes('Password')) {
            p.emailMagicLink();
          }
        } else {
          if (p.onReset) p.onReset();
          else console.warn('RxCustomerAccountView: No reset handler specified');
        }
      }}
    >
      {Wrapped}
    </button>
  );
  return <a {...p}>{Wrapped}</a>;
}

function Iterator(
  p: Props & { 'field-errors': string[]; disabled?: boolean; customer: { [key: string]: string }; onChange: (evt: { [key: string]: string | number }) => void },
) {
  const Wrapped = React.Children.map(p.children, child => {
    switch (child.type) {
      case 'input':
        if (!p.customer) return child;
        if (child.props['data-field'] === 'birthday') {
          const field = 'birthday';
          return (
            <BirthdayInput
              className={child.props.className || ''}
              onChange={birthday => {
                p.onChange({
                  birthday,
                });
              }}
              defaultValue={p.customer.birthday}
            />
          );
        }
        // if (child.props['data-field'] === 'birthday') {
        //   const dt = new Date();
        //   if (p.customer.birthday) {
        //     const [year, month, day] = p.customer.birthday.split('-').length === 3 ? p.customer.birthday.split('-').map(Number) : [1990, 10, 3];
        //     dt.setFullYear(year);
        //     dt.setMonth(month - 1);
        //     dt.setDate(day);
        //   }
        //   return (
        //     <RxDateInputGroup
        //       classOverride={child.props.className}
        //       icon={false}
        //       default_value={dt}
        //       field_name={child.props.name}
        //       onChange={v => {
        //         if (v) {
        //           p.onChange({
        //             [child.props.name]: new Date(v).toISOString().substring(0, 10),
        //           });
        //         }
        //       }}
        //     />
        //   );
        // }

        return React.cloneElement(child, {
          ...child.props,
          className: classNames(child.props.className || '', p['field-errors'].includes(child.props['data-field']) ? styles['field-has-error'] : ''),
          value: (child.props['data-field'] && p.customer[child.props['data-field']]) || '',
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.onChange({
              [child.props['data-field']]: evt.currentTarget.value,
            });
          },
        });
      case 'div':
        return (
          <div className={child.props.className} id={child.props.id}>
            <Iterator {...p} {...child.props}>
              {child.props.children}
            </Iterator>
          </div>
        );
      case 'section':
        return (
          <section className={child.props.className} id={child.props.id}>
            {child.props.children}
          </section>
        );
      case 'form':
        return (
          <div className={child.props.className + ' rexified RxCustomerAccountView-iterator'} id={child.props.id}>
            <Iterator {...p} {...child.props}>
              {child.props.children}
            </Iterator>
          </div>
        );
      case 'a':
        return (
          <CleanAnchor {...p} {...child.props} className={child.props.className}>
            {child.props.children}
          </CleanAnchor>
        );
      default:
        return child;
    }
  });

  return <>{Wrapped}</>;
}

export default function RxCustomerAccountView(p: Props) {
  const params = useSearchParams();
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [customer, setCustomer] = React.useState<{ [key: string]: string | number }>();
  const [updates, setUpdates] = React.useState<{ [key: string]: string | number }>();
  const [field_errors, setFieldErrors] = React.useState<string[]>([]);

  const onSubmit = () => {
    if (customer?.id && updates) {
      updateClient(Number(params.get('customer')), updates)
        .then(response => {
          notify({
            timeout: 5000,
            category: NotificationCategory.SUCCESS,
            message: 'Customer profile has been updated!',
          });
          setUpdates({});
          setData('viewing_customer', JSON.stringify(response));
          setCustomer(response);
        })
        .catch(e => {
          const { response } = e as AxiosError;
          let message = 'Sorry, we were unable to save your changes. Our team is working on getting this fixed. Try again later.';
          if (response?.data) {
            const error_response = response.data as unknown as {
              field?: string;
              error?: string;
            };
            if (error_response.error) message = error_response.error;
            if (error_response.field) setFieldErrors([...field_errors, error_response.field]);
          }
          notify({
            timeout: 5000,
            category: NotificationCategory.ERROR,
            message,
          });
        });
    }
  };
  const onReset = () => {
    setUpdates({});
    setCustomer(getData('viewing_customer') as unknown as {});
  };
  const onChange = (field: { [key: string]: string | number }) => {
    setUpdates({
      ...updates,
      ...field,
    });
    setCustomer({
      ...customer,
      ...field,
    });
  };

  const emailMagicLink = () => {
    if (customer)
      emailPasswordReset(customer.email as string, 'customer', [p['agent-data'].agent_id, p['agent-data'].metatags.profile_slug].join('/')).then(() => {
        notify({
          timeout: 5000,
          category: NotificationCategory.SUCCESS,
          message: `We've emailed ${customer.full_name} the instructions to log into their account.`,
        });
      });
  };

  React.useEffect(() => {
    setCustomer(getData('viewing_customer') as unknown as {});
  }, []);

  return (
    <div className={p.className + ' rexified RxCustomerAccountView'}>
      {customer && (
        <Iterator
          agent-data={p['agent-data']}
          customer={customer as unknown as {}}
          onChange={onChange}
          onSubmit={onSubmit}
          onReset={onReset}
          disabled={!updates || Object.keys(updates).length === 0}
          emailMagicLink={emailMagicLink}
          field-errors={field_errors}
        >
          {p.children}
        </Iterator>
      )}
    </div>
  );
}
