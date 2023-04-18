import { MouseEvent, ReactElement, cloneElement } from 'react';
import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import styles from './documents.module.scss';
import { DocumentInterface } from '@/_typings/document';
import { getDocumentSignedUrl } from '@/_utilities/api-calls/call-documents';
type Props = {
  template: ReactElement;
  docData: DocumentInterface;
  deleteRow: (id: string) => void;
};

export default function DocumentRow({ template, docData, deleteRow }: Props) {
  const { updatedAt, file_name, url } = docData?.attributes ?? {};

  const matches = [
    {
      //changing fields with braces inside document request row
      searchFn: searchByClasses(['one-doc-description']),
      transformChild: (child: ReactElement) => {
        return cloneElement(
          replaceAllTextWithBraces(child, { 'doc name': file_name ?? 'Document Name', 'doc upload date': updatedAt ?? 'unknown' }) as ReactElement,
          {
            className: classNames(child.props.className, styles.docRow),
            style: {},
          },
        );
      },
    },
    {
      //cta-div  action button download
      searchFn: searchByClasses(['doc-download']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          href: '#',
          download: true,
          onClick: async (e: MouseEvent<HTMLAnchorElement>) => {
            if (e.currentTarget.href === '#') e.preventDefault();

            const a = document.createElement('a');
            a.href = await getDocumentSignedUrl(file_name);
            a.setAttribute('download', 'true');
            document.body.append(a);
            a.click();
            a.remove();
          },
        });
      },
    },
    {
      //cta-div  action button delete
      searchFn: searchByClasses(['doc-delete-button']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            deleteRow(docData.id);
          },
        });
      },
    },
    {
      //cta-div  action button preview
      searchFn: searchByClasses(['doc-preview']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          href: url,
          ['data-key']: file_name,
          onClick: (e: MouseEvent) => {
            e.preventDefault();
            getDocumentSignedUrl(file_name).then(url => {
              window.open(url);
            });
          },
        });
      },
    },

    {
      // adding opacity to cta-div on hover
      searchFn: searchByClasses(['doc-cta-div']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { className: classNames(child.props.className, styles.cta), style: {} });
      },
    },
  ];
  return transformMatchingElements(template, matches) as ReactElement;
}
