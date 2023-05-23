import { captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, Dispatch, SetStateAction } from 'react';
import DocumentRow from './DocumentRow';
import { AgentData } from '@/_typings/agent';
import { DocumentInterface, DocumentsFolderInterface } from '@/_typings/document';

import DocumentsFolderDropdown from './DocumentsFolderDropdown';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import { removeDocument, removeDocumentUpload } from '@/_utilities/api-calls/call-documents';
import RxFileUploader from '@/components/RxForms/RxFileUploader';
import RxDropMenu from '@/components/_generics/RxDropMenu';

type Props = {
  template: ReactElement;
  docFolderData: DocumentsFolderInterface;
  agent_data: AgentData;
  setDocuments: Dispatch<SetStateAction<DocumentsFolderInterface[]>>;
};

export default function DocumentsFolder({ template, docFolderData, setDocuments }: Props) {
  const templates = captureMatchingElements(template, [{ searchFn: searchByClasses(['one-doc-description']), elementName: 'docRow' }]);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const deleteFolder = () => {
    removeDocument(parseInt(docFolderData.id)).then(res => {
      setDocuments(prev => [...prev.filter(docFolder => docFolder.id !== res.record.id)]);
      notify({
        timeout: 5000,
        category: NotificationCategory.SUCCESS,
        message: 'Folder has been deleted',
      });
    });
  };
  const deleteDocumentUpload = (id: string) => {
    removeDocumentUpload(parseInt(id)).then(res => {
      if (res?.record?.id) {
        setDocuments(prev => [
          ...prev.map((docFolder: DocumentsFolderInterface) => {
            const filteredData = docFolder.document_uploads.data.filter((doc: DocumentInterface) => doc.id !== res.record.id);
            return { ...docFolderData, document_uploads: { data: [...filteredData] } };
          }),
        ]);
        notify({
          timeout: 5000,
          category: NotificationCategory.SUCCESS,
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
        return (
          <RxDropMenu
            wrapperNode={child}
            menuClassNames={['doc-folder-dropdown', 'w-dropdown-list']}
            toggleClassNames={['doc-3dots-dropdown', 'w-dropdown-toggle']}
            menuRenderer={(child: ReactElement) => {
              return (<DocumentsFolderDropdown deleteFolder={deleteFolder} key={`${docFolderData.id}_dd`} child={child} />) as ReactElement;
            }}
          />
        );
      },
    },
    {
      // adding opacity to doc-upload on hover
      searchFn: searchByClasses(['doc-upload']),
      transformChild: (child: ReactElement) => {
        return cloneElement(
          <RxFileUploader className={child.props.className} data={{ document_id: docFolderData.id }}>
            {cloneElement(child, { className: '' })}
          </RxFileUploader>,
          { style: {} },
        );
      },
    },
  ];

  return transformMatchingElements(
    cloneElement(template, { key: docFolderData.id }, [
      ...template.props.children.filter((child: ReactElement) => child.props.className !== 'one-doc-description'),
      docFolderData.document_uploads.data.map((doc: DocumentInterface) => (
        <DocumentRow deleteRow={deleteDocumentUpload} key={doc.id} template={templates.docRow} docData={doc} />
      )),
    ]),
    matches,
  ) as ReactElement;
}
