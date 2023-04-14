import { captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, Dispatch, SetStateAction } from 'react';
import DocumentRow from './DocumentRow';
import { AgentData } from '@/_typings/agent';
import { DocumentInterface, DocumentsFolderInterface } from '@/_typings/document';

import DocumentsFolderDropdown from './DocumentsFolderDropdown';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import { removeDocument, removeDocumentUpload } from '@/_utilities/api-calls/call-documents';

type Props = {
  template: ReactElement;
  docFolderData: DocumentsFolderInterface;
  agent_data: AgentData;
  setDocuments: Dispatch<SetStateAction<DocumentsFolderInterface[]>>;
};

export default function DocumentsFolder({ template, docFolderData, agent_data, setDocuments }: Props) {
  const templates = captureMatchingElements(template, [{ searchFn: searchByClasses(['one-doc-description']), elementName: 'docRow' }]);
  const event = useEvent(Events.DocFolderShow);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const deleteFolder = () => {
    removeDocument(parseInt(docFolderData.id)).then(res => {
      setDocuments(prev => [...prev.filter(docFolder => docFolder.id !== res.record.id)]);
      notify({
        timeout: 5000,
        category: NotificationCategory.Success,
        message: 'Folder has been deleted',
      });
    });
  };
  const deleteDocumentUpload = (id: string) => {
    removeDocumentUpload(parseInt(id)).then(res => {
      console.log('res deleteUpload', res);
      if (res?.record?.id) {
        setDocuments(prev => [
          ...prev.map((docFolder: DocumentsFolderInterface) => {
            const filteredData = docFolder.document_uploads.data.filter((doc: DocumentInterface) => doc.id !== res.record.id);
            return { ...docFolderData, document_uploads: { data: [...filteredData] } };
          }),
        ]);
        notify({
          timeout: 5000,
          category: NotificationCategory.Success,
          message: 'Document has been deleted',
        });
      }
    });
  };
  const matches = [
    {
      //changing text in braces inside document folder ONLY
      searchFn: searchByClasses(['doc-title-row']),
      transformChild: (child: ReactElement) => {
        return replaceAllTextWithBraces(child, { 'doc folder name': docFolderData.name ?? 'DOC FOLDER ' }) as ReactElement;
      },
    },
    {
      //making dropdown click work
      searchFn: searchByClasses(['sort-dropdown', 'w-dropdown']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            event.fireEvent({ show: true, key: parseInt(docFolderData.id) });
          },
        });
      },
    },
    {
      //making dropdown show
      searchFn: searchByClasses(['doc-folder-dropdown']),
      transformChild: (child: ReactElement) => {
        return <DocumentsFolderDropdown deleteFolder={deleteFolder} id={parseInt(docFolderData.id)} key={`${docFolderData.id}_dd`} child={child} />;
      },
    },
  ];

  const transformed = transformMatchingElements(
    cloneElement(template, { key: docFolderData.id }, [
      ...template.props.children.filter((child: ReactElement) => child.props.className !== 'one-doc-description'),
      docFolderData.document_uploads.data.map((doc: DocumentInterface) => (
        <DocumentRow deleteRow={deleteDocumentUpload} key={doc.id} template={templates.docRow} docData={doc} />
      )),
    ]),
    matches,
  ) as ReactElement;

  return transformed;
}
