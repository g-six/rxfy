'use client';
import { AgentData } from '@/_typings/agent';
import { CustomerDataModel } from '@/_typings/customer';
import { updateClient } from '@/_utilities/api-calls/call-clients';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { RxDateInputGroup } from '@/components/RxForms/RxInputs/RxDateInputGroup';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type Props = {
  className?: string;
  children: React.ReactElement;
  onReset?(): void;
  onSubmit?(): void;
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
  if (p.className?.includes('secondary'))
    return (
      <button
        className={p.className}
        type='reset'
        onClick={() => {
          if (p.onReset) p.onReset();
          else console.warn('RxCustomerAccountView: No reset handler specified');
        }}
      >
        {Wrapped}
      </button>
    );
  return <a {...p}>{Wrapped}</a>;
}

function Iterator(p: Props & { disabled?: boolean; customer: { [key: string]: string }; onChange: (evt: { [key: string]: string | number }) => void }) {
  const Wrapped = React.Children.map(p.children, child => {
    switch (child.type) {
      case 'input':
        if (!p.customer) return child;
        if (child.props.name === 'birthday') {
          const dt = new Date();
          if (child.props.name && p.customer[child.props.name]) {
            const [year, month, day] =
              p.customer[child.props.name] && typeof p.customer[child.props.name] === 'string'
                ? p.customer[child.props.name].split('-').map(Number)
                : [1990, 10, 3];
            dt.setFullYear(year);
            dt.setMonth(month - 1);
            dt.setDate(day);
          }
          return (
            <RxDateInputGroup
              classOverride={child.props.className}
              icon={false}
              default_value={dt}
              field_name={child.props.name}
              onChange={v => {
                if (v) {
                  p.onChange({
                    [child.props.name]: new Date(v).toISOString().substring(0, 10),
                  });
                }
              }}
            />
          );
        }
        return React.cloneElement(child, {
          ...child.props,
          value: (child.props.name && p.customer[child.props.name]) || '',
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            p.onChange({
              [child.props.name]: evt.currentTarget.value,
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
  const agent_customer_id = Number(params.get('customer'));
  const [customer, setCustomer] = React.useState<{ [key: string]: string | number }>();
  const [updates, setUpdates] = React.useState<{ [key: string]: string | number }>();

  const onSubmit = () => {
    if (customer?.id && updates) {
      updateClient(Number(customer.id), updates).then(console.log).catch(console.error);
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
        >
          {p.children}
        </Iterator>
      )}
    </div>
  );
}
