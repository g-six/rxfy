import { captureMatchingElements, replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';
import DocumentRow from './DocumentRow';

type Props = {
  template: ReactElement;
  docFolderData: any;
};

export default function DocumentsFolder({ template, docFolderData }: Props) {
  const templates = captureMatchingElements(template, [{ searchFn: searchByClasses(['one-doc-description']), elementName: 'docRow' }]);
  const matches = [
    {
      //changing text in braces inside document folder ONLY
      searchFn: searchByClasses(['doc-title-row']),
      transformChild: (child: ReactElement) => {
        return replaceAllTextWithBraces(child, { 'doc folder name': docFolderData.name ?? 'DOC FOLDER ' }) as ReactElement;
      },
    },
  ];

  return transformMatchingElements(
    cloneElement(template, {}, [
      ...template.props.children.filter((child: ReactElement) => child.props.className !== 'one-doc-description'),
      docFolderData.document_uploads.data.map((doc: any) => <DocumentRow key={doc.id} template={templates.docRow} docData={doc} />),
    ]),
    matches,
  ) as ReactElement;
}
