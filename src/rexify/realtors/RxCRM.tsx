import React from 'react';
import RxCRMLeadsWrapper from './crm/LeadsWrapper';
import RxCRMCustomerPreview from './crm/CustomerPreview';

type Props = {
  children: React.ReactElement;
  className?: string;
};

type ChildProps = {
  children: React.ReactElement;
  className?: string;
};

function Iterator(p: ChildProps) {
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
        return <></>;
      } else if (child.type !== 'div') {
        return child;
      }
      return <Iterator {...child.props}>{child.props.children}</Iterator>;
    } else {
      return child;
    }
  });
  return <div {...p}>{Wrapped}</div>;
}

export default function RxCRM(p: Props) {
  return (
    <div className={['RxCRM', p.className || ''].join(' ').trim()}>
      <Iterator {...p}>{p.children}</Iterator>
    </div>
  );
}
