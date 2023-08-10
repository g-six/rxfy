'use client';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';

import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByProp } from '@/_utilities/rx-element-extractor';
import { removeDocument, retrieveDocuments } from '@/_utilities/api-calls/call-documents';
import DocumentsFolder from './DocumentsFolder';
import DocumentsCreateFolder from './DocumentsCreateFolder';
import { Events, EventsData, NotificationCategory, NotificationMessages } from '@/_typings/events';
import { AgentData } from '@/_typings/agent';
import { DocumentsFolderInterface } from '@/_typings/document';
import useEvent from '@/hooks/useEvent';
import { useSearchParams } from 'next/navigation';
import { CenterLoader } from '@/app/loading';
interface Props {
  nodeProps: any;
  nodes?: ReactElement[];
  agent_data: AgentData;
}

function ConfirmDeleteIterator({ children, onCancel, onConfirm }: { children: React.ReactElement; onConfirm: () => void; onCancel: () => void }) {
  const Wrapped = React.Children.map(children, c => {
    if (c.type === 'div') {
      return (
        <div className={c.props.className}>
          <ConfirmDeleteIterator onCancel={onCancel} onConfirm={onConfirm}>
            {c.props.children}
          </ConfirmDeleteIterator>
        </div>
      );
    }
    if (c.type === 'a') {
      if (`${c.props.children}` === 'Cancel') {
        return React.cloneElement(c, {
          ...c.props,
          onClick: onCancel,
        });
      }
      if (`${c.props.children}` === 'Delete') {
        return React.cloneElement(c, {
          ...c.props,
          onClick: onConfirm,
        });
      }
    }
    return c;
  });

  return <>{Wrapped}</>;
}

export default function DocumentsReplacer({ nodes, nodeProps, agent_data }: Props & { confirm?: boolean }) {
  const params = useSearchParams();
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { data: create_folder_modal } = useEvent(Events.CreateDocFolderShow);
  const [documents, setDocuments] = useState<DocumentsFolderInterface[]>([]);
  const templatesToFind = [{ searchFn: searchByClasses(['document-div']), elementName: 'docFolder' }];
  const templates = captureMatchingElements(nodes, templatesToFind);
  const { data: notification } = useEvent(Events.SystemNotification);
  const delete_event = useEvent(Events.GenericEvent);
  const [has_loaded, toggleLoaded] = useState<boolean>(false);
  const {
    data: { confirm, folder, id: folder_to_delete, confirmed_action },
  } = delete_event as unknown as {
    data: {
      id?: number;
      confirm?: boolean;
      folder?: boolean;
      confirmed_action?: string;
    };
  };

  let agent_customer_id = params.get('customer') ? Number(params.get('customer')) : 0;

  useEffect(() => {
    if (notification?.message === NotificationMessages.DOC_UPLOAD_COMPLETE) {
      retrieveDocuments(agent_customer_id).then(d => {
        setDocuments(d);
      });
    }
  }, [notification]);

  useEffect(() => {
    if (folder && folder_to_delete && confirmed_action === 'delete-folder') {
      delete_event.fireEvent({});
      removeDocument(folder_to_delete).then(res => {
        setDocuments(prev => [...prev.filter(docFolder => folder_to_delete !== Number(docFolder.id))]);
        notify({
          timeout: 5000,
          category: NotificationCategory.SUCCESS,
          message: 'Folder has been deleted',
        });
      });
    }
  }, [folder, confirmed_action]);

  useEffect(() => {
    if (isNaN(agent_customer_id)) agent_customer_id = 0;
    retrieveDocuments(agent_customer_id).then(documents => {
      toggleLoaded(true);
      setDocuments(documents || []);
    });
  }, []);

  const matches = [
    {
      //getting to doc folders container to populate  doc folders
      searchFn: searchByProp('data-field', 'doc_folder'),
      transformChild: (child: ReactElement) => {
        if (!has_loaded) return <CenterLoader />;

        if (documents.length === 0) return <></>;
        return cloneElement(
          child,
          {
            className: '',
          },
          [
            documents.map((doc: DocumentsFolderInterface) => (
              <DocumentsFolder key={doc.id} template={templates.docFolder} docFolderData={doc} agent_data={agent_data} setDocuments={setDocuments} />
            )),
          ],
        );
      },
    },
    {
      searchFn: searchByProp('data-field', 'empty_state'),
      transformChild: (child: ReactElement) => {
        const show = create_folder_modal?.show || !documents.length;
        return cloneElement(child, {
          className: show && has_loaded ? child.props.className : 'hidden',
        });
      },
    },
    {
      searchFn: searchByProp('data-field', 'new_doc'),
      transformChild: (child: ReactElement) => {
        return <DocumentsCreateFolder child={child} agent_data={agent_data} setDocuments={setDocuments} agent-customer={agent_customer_id} />;
      },
    },

    {
      searchFn: searchByProp('data-field', 'new_folder'),
      transformChild: (child: ReactElement) => {
        return cloneElement(<button type='button' />, {
          ...child.props,
          onClick: () => {
            document.dispatchEvent(new CustomEvent(Events.CreateDocFolderShow, { detail: { show: true } }));
            document.querySelector('.docs-section [data-field="empty_state"]')?.remove();
          },
        });
      },
    },
    {
      searchFn: searchByClasses(['confirm-delete']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          ...child.props,
          className: confirm ? 'flex items-center align-center justify-center fixed top-0 left-0 w-screen h-screen z-40' : child.props.className,
          children: (
            <ConfirmDeleteIterator
              onCancel={() => {
                delete_event.fireEvent({});
              }}
              onConfirm={() => {
                delete_event.fireEvent({
                  confirm: true,
                  confirmed_action: 'delete' + (folder ? '-folder' : ''),
                } as unknown as EventsData);
              }}
            >
              {child.props.children}
            </ConfirmDeleteIterator>
          ),
        });
      },
    },
  ];
  return (
    <div {...nodeProps} data-rx='_replacers/Documents/documents'>
      {transformMatchingElements(nodes, matches)}
    </div>
  );
}
