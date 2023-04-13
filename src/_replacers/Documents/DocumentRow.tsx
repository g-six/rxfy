import { replaceAllTextWithBraces, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { classNames } from '@/_utilities/html-helper';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, cloneElement } from 'react';
import styles from './documents.module.scss';
type Props = {
  template: ReactElement;
  docData: any;
};

export default function DocumentRow({ template, docData }: Props) {
  const { updatedAt, file_name, url } = docData?.attributes ?? {};
  const handleDownload = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
    xhr.send();
  };
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
          onClick: handleDownload,
        });
      },
    },
    {
      //cta-div  action button delete
      searchFn: searchByClasses(['doc-delete-button']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            console.log('delete click');
          },
        });
      },
    },
    {
      //cta-div  action button preview
      searchFn: searchByClasses(['doc-preview']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: () => {
            console.log('preview click');
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
