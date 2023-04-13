import { captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement, useRef, useState } from 'react';
import DocumentRow from './DocumentRow';
import { AgentData } from '@/_typings/agent';
import { DocumentInterface, DocumentsFolderInterface } from '@/_typings/document';

import DocumentsFolderDropdown from './DocumentsFolderDropdown';
import useEvent, { Events } from '@/hooks/useEvent';

type Props = {
  template: ReactElement;
  docFolderData: DocumentsFolderInterface;
  agent_data: AgentData;
};

export default function DocumentsFolder({ template, docFolderData, agent_data }: Props) {
  const templates = captureMatchingElements(template, [{ searchFn: searchByClasses(['one-doc-description']), elementName: 'docRow' }]);
  const event = useEvent(Events.DocFolderShow);

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
        return <DocumentsFolderDropdown id={parseInt(docFolderData.id)} key={`${docFolderData.id}_dd`} child={child} />;
      },
    },
  ];

  const transformed = transformMatchingElements(
    cloneElement(template, { key: docFolderData.id }, [
      ...template.props.children.filter((child: ReactElement) => child.props.className !== 'one-doc-description'),
      docFolderData.document_uploads.data.map((doc: DocumentInterface) => <DocumentRow key={doc.id} template={templates.docRow} docData={doc} />),
    ]),
    matches,
  ) as ReactElement;

  return transformed;
}
