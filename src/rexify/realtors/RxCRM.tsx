'use client';
import React from 'react';
import RxCRMLeadsWrapper from './crm/LeadsWrapper';
import RxCRMCustomerPreview from './crm/CustomerPreview';
import RxCRMCustomerCreateForm from './crm/CustomerCreateForm';
import { Events, EventsData } from '@/hooks/useFormEvent';
import useEvent from '@/hooks/useEvent';

type Props = {
  children: React.ReactElement;
  className?: string;
};

type ChildProps = {
  children: React.ReactElement;
  className?: string;
  showForm: () => void;
};

function Iterator(p: ChildProps) {
  const { showForm, ...props } = p;
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.children) {
      if (child.props?.id && child.props?.id === 'leads_wrapper') {
        return (
          <RxCRMLeadsWrapper {...child.props} data-status='lead'>
            {child.props.children}
          </RxCRMLeadsWrapper>
        );
      } else if (child.props?.id && child.props?.id === 'active_wrapper') {
        return (
          <RxCRMLeadsWrapper {...child.props} data-status='active'>
            {child.props.children}
          </RxCRMLeadsWrapper>
        );
      } else if (child.props?.id && child.props?.id === 'closed_wrapper') {
        return (
          <RxCRMLeadsWrapper {...child.props} data-status='closed'>
            {child.props.children}
          </RxCRMLeadsWrapper>
        );
      } else if (child.props?.className && child.props.className.indexOf('client-preview') >= 0) {
        return <RxCRMCustomerPreview {...child.props}>{child.props.children}</RxCRMCustomerPreview>;
      } else if (child.props?.className && child.props.className.indexOf('new-client') >= 0) {
        return <RxCRMCustomerCreateForm {...child.props}>{child.props.children}</RxCRMCustomerCreateForm>;
      } else if (child.props.id === `${Events.CreateCustomerForm}-trigger`) {
        return (
          <button {...child.props} type='button' onClick={showForm}>
            {child.props.children}
          </button>
        );
      } else if (child.type !== 'div') {
        return child;
      }
      return (
        <Iterator {...p} {...child.props}>
          {child.props.children}
        </Iterator>
      );
    } else {
      return child;
    }
  });
  return <div {...props}>{Wrapped}</div>;
}

export default function RxCRM(p: Props) {
  const formToggle = useEvent(Events.CreateCustomerForm);
  return (
    <div className={['RxCRM', p.className || ''].join(' ').trim()}>
      <Iterator
        {...p}
        showForm={() => {
          formToggle.fireEvent({
            active: true,
          } as unknown as EventsData);
        }}
      >
        {p.children}
      </Iterator>
    </div>
  );
}
