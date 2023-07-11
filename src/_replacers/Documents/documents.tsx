'use client';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';

import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { retrieveDocuments } from '@/_utilities/api-calls/call-documents';
import DocumentsFolder from './DocumentsFolder';
import DocumentsCreateFolder from './DocumentsCreateFolder';
import { Events, NotificationMessages } from '@/_typings/events';
import { AgentData } from '@/_typings/agent';
import { DocumentsFolderInterface } from '@/_typings/document';
import useEvent from '@/hooks/useEvent';
import { useSearchParams } from 'next/navigation';
interface Props {
  nodeProps: any;
  nodes?: ReactElement[];
  agent_data: AgentData;
}

export default function DocumentsReplacer({ nodes, nodeProps, agent_data }: Props) {
  const params = useSearchParams();
  const [documents, setDocuments] = useState<DocumentsFolderInterface[]>([]);
  const templatesToFind = [{ searchFn: searchByClasses(['document-div']), elementName: 'docFolder' }];
  const templates = captureMatchingElements(nodes, templatesToFind);
  const { data: notification } = useEvent(Events.SystemNotification);

  let agent_customer_id = params.get('customer') ? Number(params.get('customer')) : 0;

  useEffect(() => {
    if (notification?.message === NotificationMessages.DOC_UPLOAD_COMPLETE) {
      retrieveDocuments(agent_customer_id).then(documents => {
        setDocuments(documents);
      });
    }
  }, [notification]);

  useEffect(() => {
    if (isNaN(agent_customer_id)) agent_customer_id = 0;
    retrieveDocuments(agent_customer_id).then(documents => {
      setDocuments(documents || []);
    });
  }, []);
  const matches = [
    {
      //getting to doc folders container to populate  doc folders
      searchFn: searchByClasses(['doc-folders-container']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {}, [
          documents.map((doc: DocumentsFolderInterface) => (
            <DocumentsFolder key={doc.id} template={templates.docFolder} docFolderData={doc} agent_data={agent_data} setDocuments={setDocuments} />
          )),
        ]);
      },
    },
    {
      searchFn: searchByClasses(['new-doc-div']),
      transformChild: (child: ReactElement) => {
        return <DocumentsCreateFolder child={child} agent_data={agent_data} setDocuments={setDocuments} agent-customer={agent_customer_id} />;
      },
    },
    {
      searchFn: searchByClasses(['new-dr']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            document.dispatchEvent(new CustomEvent(Events.CreateDocFolderShow, { detail: { show: true } }));
          },
        });
      },
    },
  ];
  return <div {...nodeProps}>{transformMatchingElements(nodes, matches)}</div>;
}
