'use client';
import React, { ReactElement, cloneElement, useEffect, useState } from 'react';

import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { retrieveDocuments } from '@/_utilities/api-calls/call-documents';
import DocumentsFolder from './DocumentsFolder';
import DocumentsCreateFolder from './DocumentsCreateFolder';
import { Events } from '@/_typings/events';
interface Props {
  nodeProps: any;
  nodes?: ReactElement[];
}
export default function DocumentsReplacer({ nodes, nodeProps }: Props) {
  const [documents, setDocuments] = useState([]);
  const templatesToFind = [{ searchFn: searchByClasses(['document-div']), elementName: 'docFolder' }];
  const templates = captureMatchingElements(nodes, templatesToFind);

  useEffect(() => {
    retrieveDocuments().then(documents => {
      setDocuments(documents);
      console.log(documents);
    });
  }, []);
  const matches = [
    {
      //getting to doc folders container to populate  doc folders
      searchFn: searchByClasses(['doc-folders-container']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {}, [documents.map((doc: any) => <DocumentsFolder key={doc.id} template={templates.docFolder} docFolderData={doc} />)]);
      },
    },
    {
      searchFn: searchByClasses(['new-doc-div']),
      transformChild: (child: ReactElement) => {
        return <DocumentsCreateFolder child={child} />;
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
