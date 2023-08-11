'use client';
import { Children, ReactElement, SyntheticEvent, cloneElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import { RxButton } from '@/components/RxButton';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import Cookies from 'js-cookie';

type DataContainer = {
  head_code?: string;
  footer_code?: string;
};
function Rexify({
  children,
  ...props
}: {
  children: ReactElement;
  onTextChange(key: string, value: string): void;
  'form-data': DataContainer;
  'agent-id': string;
  'form-state': 'loading' | 'enabled' | 'disabled' | 'finishing';
}) {
  const Rexified = Children.map(children, c => {
    const { className, children: sub } = c.props || {};

    if (c.type === 'textarea') {
      switch (c.props.id) {
        case 'head-code':
          return cloneElement(c, {
            value: props['form-data'].head_code || '',
            onChange: (evt: SyntheticEvent<HTMLInputElement>) => {
              props.onTextChange('head_code', evt.currentTarget.value);
            },
          });
        case 'footer_code':
          return cloneElement(c, {
            onChange: (evt: SyntheticEvent<HTMLInputElement>) => {
              props.onTextChange('footer_code', evt.currentTarget.value);
            },
            value: props['form-data'].footer_code || '',
          });
      }
    }

    if (c.type === 'a' && className?.includes('cta-tracking-save')) {
      return (
        <RxButton
          id={Events.UpdateTrackingCodes + '-trigger'}
          rx-event={Events.UpdateTrackingCodes}
          className={className}
          type='button'
          disabled={props['form-state'] !== 'enabled'}
          loading={['loading', 'finishing'].includes(props['form-state'])}
        >
          {sub}
        </RxButton>
      );
    }

    if (sub && typeof sub.children !== 'string') {
      return cloneElement(c, {}, <Rexify {...props}>{sub}</Rexify>);
    }
    return c;
  });
  return <>{Rexified}</>;
}

export default function RxTrackingCodes({ children, realtor }: { children: ReactElement; realtor: AgentData }) {
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { data, fireEvent: updateForm } = useEvent(Events.UpdateTrackingCodes);
  let { clicked, head_code, footer_code } = data as unknown as DataContainer & {
    clicked: string;
  };
  head_code = realtor.metatags?.head_code || '';
  footer_code = realtor.metatags?.footer_code || '';
  const [form_data, setFormData] = useState<DataContainer>({
    head_code: realtor.metatags.head_code || '',
    footer_code: realtor.metatags.footer_code || '',
  });
  const [button_state, toggleSaveButton] = useState<'disabled' | 'loading' | 'enabled' | 'finishing'>('disabled');

  const handleTextChange = (key: string, value: string) => {
    setFormData({
      ...form_data,
      [key]: value,
    });
  };

  // Check if form is modified
  useEffect(() => {
    let updated = false;
    if (form_data.head_code !== head_code) {
      updated = true;
    }
    if (!updated && form_data.footer_code !== footer_code) {
      updated = true;
    }
    if (updated && button_state === 'disabled') {
      toggleSaveButton('enabled');
    }
    if (!updated && button_state !== 'disabled') {
      toggleSaveButton('disabled');
    }
  }, [form_data]);

  useEffect(() => {
    if (clicked) {
      toggleSaveButton('loading');
    }
  }, [clicked]);

  useEffect(() => {
    if (button_state === 'loading') {
      if (realtor.metatags.id) {
        updateAccount(
          Cookies.get('session_key') as string,
          {
            metatags: {
              ...form_data,
              id: realtor.metatags.id,
            },
          },
          true,
        )
          .then(() => {
            toggleSaveButton('disabled');
          })
          .finally(() => {
            updateForm({
              ...data,
              clicked: undefined,
            });
            notify({
              category: NotificationCategory.SUCCESS,
              message: 'You code snippets have been updated.',
              timeout: 3500,
            });
          });
      }
    }
  }, [button_state]);

  return (
    <Rexify form-data={form_data} agent-id={realtor.agent_id} onTextChange={handleTextChange} form-state={button_state}>
      {children}
    </Rexify>
  );
}
