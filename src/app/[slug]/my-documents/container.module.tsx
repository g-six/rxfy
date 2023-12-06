'use client';

import { Children, ReactElement, cloneElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import ClientDashboardIterator from '@/rexify/realtors/ClientDashboardIterator.module';

import Cookies from 'js-cookie';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import MyDocumentsNewDocumentComponent from './new-document.component';
import { CustomerRecord } from '@/_typings/customer';
import MyDocumentsFolderComponent from './folders.component';
import ConfirmDeleteIterator from './confirm-delete.dialog';
import { classNames } from '@/_utilities/html-helper';
import { DocumentsFolderInterface } from '@/_typings/document';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { getAgentBaseUrl } from '@/app/api/_helpers/agent-helper';

interface Props {
  agent: AgentData;
  children: ReactElement;
  className?: string;
}

export default function MyDocumentsContainer({ agent, children, ...props }: Props) {
  const session = useEvent(Events.LoadUserSession);
  const listener = useEvent(Events.GenericEvent);
  const evt = useEvent(Events.CreateDocFolderShow);
  const { data } = useEvent(Events.DocFolderShow);
  const { folders } = data as unknown as {
    folders?: DocumentsFolderInterface[];
  };
  const [customer, setCustomer] = useState<CustomerRecord>();

  useEffect(() => {
    // Initiate dashboard panel by loading the customer data if not loaded before
    // and if user type is customer
    if (!session.data?.user && Cookies.get('session_as') === 'customer') {
      getUserBySessionKey(Cookies.get('session_key') as string, 'customer').then(user => {
        setCustomer(user as unknown as CustomerRecord);
        session.fireEvent({
          ...session.data,
          user,
          customer_id: Number(user.id),
        } as unknown as EventsData);
      });
    }
  }, []);

  return (
    <>
      <ClientDashboardIterator
        id='MyDocuments'
        className={'RxCustomerView-ClientDashboardIterator rexified '}
        onCancel={() => {
          console.log('canceled');
        }}
        onConfirm={console.log}
        reload={console.log}
        agent={agent}
      >
        {customer ? (
          <Rexify
            {...props}
            agent={agent}
            customer={customer}
            delete={listener}
            createFolder={() => {
              evt.fireEvent({ show: true });
            }}
            folders={folders}
            show-create-folder={evt.data?.show}
          >
            {children}
          </Rexify>
        ) : (
          <></>
        )}
      </ClientDashboardIterator>
    </>
  );
}

function Rexify({
  children,
  ...props
}: Props & {
  customer: CustomerRecord;
  createFolder(): void;
  folders?: DocumentsFolderInterface[];
  delete: {
    data?: EventsData;
    fireEvent(data: EventsData): void;
  };
  'show-create-folder'?: boolean;
}) {
  const Rexified = Children.map(children, c => {
    if (c.props?.['data-field'] === 'empty_state') {
      return props['show-create-folder'] || props.folders?.length ? (
        <></>
      ) : (
        <section className='w-72 max-xl:w-96 flex flex-col gap-6 bg-white rounded-2xl shadow-2xl p-4 shadow-slate-500/10 items-center justify-center'>
          {Children.map(c.props.children, cc => {
            if (cc.type === 'a') {
              return (
                <button type='button' className={cc.props.className + ' min-w-full'}>
                  {cc.props.children}
                </button>
              );
            }
            return cc;
          })}
        </section>
      );
    }

    if (c.props?.['data-field'] === 'new_folder') {
      return cloneElement(c, { onClick: () => props.createFolder() });
    }

    if (c.type === 'a' && c.props.href.indexOf('/') === 0) {
      return cloneElement(c, { href: c.props.href.substring(1) });
    }

    if (c.props?.children && typeof c.props.children !== 'string') {
      const { children: child, className, ...attribs } = c.props;
      if (c.props['data-field'] === 'new_doc') {
        return props['show-create-folder'] ? (
          cloneElement(
            c,
            {
              className: `${className || ''} rx-my-documents--container`,
            },
            <MyDocumentsNewDocumentComponent {...props} {...attribs}>
              {child}
            </MyDocumentsNewDocumentComponent>,
          )
        ) : (
          <></>
        );
      }
      if (c.props['data-group'] === 'folders') {
        return cloneElement(
          c,
          {
            className: `${className || ''} rx-my-documents--container`,
          },
          <MyDocumentsFolderComponent {...props} {...attribs}>
            {child}
          </MyDocumentsFolderComponent>,
        );
      }

      if (c.props?.className?.includes('confirm-delete')) {
        const { id: delete_id, folder } = props.delete.data as unknown as {
          id: number;
          folder: number;
        };
        return cloneElement(
          c,
          {
            className: classNames('rexified w-full fixed top-0 h-full flex flex-col items-center justify-center', delete_id || folder ? '' : 'hidden'),
          },
          <ConfirmDeleteIterator
            item-type={folder ? 'folder' : 'file'}
            onCancel={() => {
              props.delete.fireEvent({});
            }}
            onConfirm={(type: string) => {
              props.delete.fireEvent({
                ...props.delete.data,
                type,
                confirm: true,
              } as unknown as EventsData);
            }}
          >
            {c.props.children}
          </ConfirmDeleteIterator>,
        );
      }

      return cloneElement(
        c,
        {
          className: `${className || ''} rx-my-documents--container`,
        },
        <Rexify {...props} {...attribs}>
          {child}
        </Rexify>,
      );
    } else if (c.type === 'img') {
      if (c.props['data-field']?.indexOf('logo_for') === 0) {
        switch (c.props['data-field']) {
          case 'logo_for_dark_bg':
            if (props.agent.metatags?.logo_for_dark_bg) {
              return cloneElement(c, { src: getImageSized(props.agent.metatags?.logo_for_dark_bg, 200) });
            }
          case 'logo_for_light_bg':
            if (props.agent.metatags?.logo_for_light_bg) {
              return cloneElement(c, { src: getImageSized(props.agent.metatags?.logo_for_light_bg, 200) });
            }
          default:
            return (
              <div
                className={c.props.className + ' navbar-logo-text text-neutral-800 font-bold pb-5 w-24 text-xs'}
                style={{ background: `url(${c.props.src}) bottom / contain no-repeat` }}
              >
                {props.agent.full_name}
              </div>
            );
        }
      }
    }
    return c;
  });
  return <>{Rexified}</>;
}
