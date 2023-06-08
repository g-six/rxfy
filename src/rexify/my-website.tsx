'use client';
import { RealtorInputModel } from '@/_typings/agent';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import React from 'react';
type Props = {
  children: React.ReactElement;
};

export function MyWebsite(p: Props) {
  const { data, fireEvent: loadUserDataIntoEventState } = useEvent(Events.LoadUserSession);
  const { data: acted } = useEvent(Events.SaveUserSession);
  const [updates, setUpdates] = React.useState<RealtorInputModel | undefined>();
  React.useEffect(() => {
    if (updates && Cookies.get('session_key')) {
      setUpdates(undefined);
      updateAccount(Cookies.get('session_key') as string, updates as RealtorInputModel, true)
        .then(console.log)
        .catch(console.error);
    }
  }, [updates]);
  React.useEffect(() => {
    const agent = data as unknown as { [key: string]: unknown };
    if (Object.keys(agent).length === 0 && Cookies.get('session_key')) {
      getUserBySessionKey(Cookies.get('session_key') as string, 'realtor')
        .then(data => {
          loadUserDataIntoEventState(data);
        })
        .catch(e => {
          const axerr = e as AxiosError;
          if (axerr.response?.status === 401) {
            console.log(axerr.response.statusText);
            // clearSessionCookies();
            // setTimeout(() => {
            //   location.href = '/log-in';
            // }, 500);
          }
        });
    }
  }, [data]);
  React.useEffect(() => {
    const { progress, ...updates } = acted as unknown as { [key: string]: unknown };
    if (progress === 0) {
      setUpdates(updates as unknown as RealtorInputModel);
    }
  }, [acted]);
  return (
    <>
      {React.Children.map(p.children, child => {
        return (
          <Iterator {...child.props} data={data}>
            {child}
          </Iterator>
        );
      })}
    </>
  );
}

function Iterator(p: {
  data: EventsData;
  className?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  type: string;
  children: React.ReactElement;
}) {
  const { fireEvent } = useEvent(Events.SaveUserSession);
  const { data } = useEvent(Events.LoadUserSession);
  if (p.children?.props?.children) {
    if (p.children.type === 'a') {
      switch (p.children.props.children) {
        case 'Save':
          return (
            <button
              className={p.children.props.className}
              id={`${Events.SaveUserSession}-trigger`}
              onClick={() => {
                fireEvent({
                  progress: 0,
                } as unknown as EventsData);
              }}
            >
              {p.children.props.children}
            </button>
          );
      }
    }
    return (
      <>
        {React.cloneElement(p.children, {
          children: React.Children.map(p.children.props.children, child => {
            return <Iterator {...child.props}>{child}</Iterator>;
          }),
        })}
      </>
    );
  }
  if ((p.type === 'text' && p.id) || p.placeholder) {
    let props = p as unknown as { [key: string]: unknown };
    if (props.children) {
      props = {
        ...props,
        children: undefined,
      };
    }

    console.log({ data });
    return (
      <input
        {...props}
        name={getAgentFieldName(p)}
        onChange={e => {
          fireEvent({
            ...p.data,
            [e.currentTarget.name]: e.currentTarget.value,
          } as unknown as EventsData);
        }}
      />
    );
  }
  return <>{p.children}</>;
}

function getAgentFieldName(props: { id?: string; placeholder?: string }) {
  if (props.id) {
    switch (props.id) {
      case 'Your-domain-URL':
        return 'domain_name';
    }
  }
  if (props.placeholder) {
    switch (props.placeholder.toLowerCase()) {
      case 'site title':
        return 'metatag_title';
    }
  }
}
