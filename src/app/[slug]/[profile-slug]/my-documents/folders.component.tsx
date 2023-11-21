import { classNames } from '@/_utilities/html-helper';
import { Children, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';
import styles from './new-document.module.scss';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import SpinningDots from '@/components/Loaders/SpinningDots';
import { removeDocument, retrieveDocuments } from '@/_utilities/api-calls/call-documents';
import { AgentData } from '@/_typings/agent';
import { CustomerRecord } from '@/_typings/customer';
import { DocumentsFolderInterface } from '@/_typings/document';
import RxFileUploader from '@/components/RxForms/RxFileUploader';
import { MyDocumentsDeleteDocumentButton, MyDocumentsDownloadDocumentButton } from './document-buttons.component';
import { NotificationCategory, NotificationMessages } from '@/_typings/events';
import MyDocumentsToggleFolderActions from './folder-buttons.component';
import MyDocumentsFolderActions from './folder-actions.dropdown';

interface Props {
  agent: AgentData;
  customer: CustomerRecord;
  children: ReactElement;
  className?: string;
}

export default function MyDocumentsFolderComponent({ children, className: elementClassName, ...props }: Props) {
  const className = `${elementClassName || ''} rx-MyDocumentsFolderComponent`.trim();
  const evt = useEvent(Events.DocFolderShow);
  const listener = useEvent(Events.GenericEvent);
  const { data: notifications } = useEvent(Events.SystemNotification);
  const {
    folders = [],
    reload = false,
    active_folder,
  } = (evt.data || {}) as unknown as {
    folders: DocumentsFolderInterface[];
    reload?: boolean;
    active_folder?: number;
  };
  const { message, category } = notifications as unknown as {
    category: NotificationCategory;
    message: NotificationMessages;
  };

  function handleAction(action: string, folder_id: number) {
    switch (action) {
      case 'delete_folder':
        listener.fireEvent({ folder: folder_id, action } as unknown as EventsData);

      //   evt.fireEvent({

      //   })
      //     removeDocument(folder_id).then(console.log);
    }
    console.log({ action, folder_id });
  }

  useEffect(() => {
    if (listener.data) {
      const { folder, confirm } = listener.data as unknown as { folder: number; confirm: boolean };
      if (folder && confirm) {
        removeDocument(folder)
          .then(console.log)
          .finally(() => {
            evt.fireEvent({
              reload: true,
            });
            listener.fireEvent({});
          });
      }
    }
  }, [listener.data]);

  useEffect(() => {
    if (message === NotificationMessages.DOC_UPLOAD_COMPLETE && category === NotificationCategory.SUCCESS) {
      retrieveDocuments().then(folders => {
        evt.fireEvent({
          folders,
          reload: undefined,
        } as unknown as EventsData);
      });
    }
  }, [message, category]);

  useEffect(() => {
    if (reload) {
      retrieveDocuments().then(folders => {
        evt.fireEvent({
          folders,
          reload: undefined,
        } as unknown as EventsData);
      });
    }
  }, [reload]);

  useEffect(() => {
    retrieveDocuments().then(folders => {
      evt.fireEvent({
        folders,
      } as unknown as EventsData);
    });
  }, []);

  return (
    <>
      {folders.map(folder => (
        <Rexifier
          className={className}
          {...props}
          folder={folder}
          key={folder.id}
          show-actions={active_folder === Number(folder.id)}
          handleAction={action => handleAction(action, Number(folder.id))}
        >
          <section className={className}>{children}</section>
        </Rexifier>
      ))}
    </>
  );
}

function FileRexifier({ children, className, ...props }: Props & { file: { id: number; file_name: string } }) {
  const rexified = Children.map(children, c => {
    if (c.props?.['data-field']) {
      const field_name = c.props['data-field'];
      const file_fields = props.file as unknown as {
        [k: string]: string | number;
      };
      return cloneElement(
        c,
        {
          className: `${c.props?.className} rexified`,
        },
        file_fields[field_name],
      );
    }
    if (c.props?.['data-action'] === 'download') {
      return <MyDocumentsDownloadDocumentButton file-name={props.file.file_name}>{c}</MyDocumentsDownloadDocumentButton>;
    }
    if (c.props?.['data-action'] === 'delete') {
      return <MyDocumentsDeleteDocumentButton file-id={props.file.id}>{c}</MyDocumentsDeleteDocumentButton>;
    }

    if (c.props?.children && typeof c.props.children !== 'string') {
      if (c.props.className?.includes('one-doc-description')) {
        return cloneElement(
          c,
          {},
          <FileRexifier {...props} {...c.props}>
            {c.props.children}
          </FileRexifier>,
        );
      }
      return cloneElement(
        c,
        {
          className: `${c.props?.className} rexified`,
          style: undefined,
        },
        <FileRexifier {...props} {...c.props}>
          {c.props.children}
        </FileRexifier>,
      );
    }

    return c;
  });
  return <>{rexified}</>;
}

function Rexifier({
  children,
  className,
  ...props
}: Props & { 'is-creating'?: boolean; 'show-actions'?: boolean; folder: DocumentsFolderInterface; handleAction(action: string): void }) {
  const Rexified = Children.map(children, c => {
    let className = `${c.props?.className || ''} rx-my-documents rx-document-folders-component`;
    if (c.props?.['data-field']) {
      switch (c.props['data-field']) {
        case 'name':
          return cloneElement(c, {}, props.folder.name);
      }
    }
    if (c.props?.['data-group'] === 'folder_actions') {
      const { children: menu_items } = c.props.children[1].props.children.props;
      return (
        <MyDocumentsFolderActions
          className={classNames(className, 'bg-transparent')}
          icon={c.props.children[0]}
          menuClassName={c.props.children[1].props.className}
          handleAction={props.handleAction}
        >
          {menu_items}
        </MyDocumentsFolderActions>
      );
    }
    // if (c.props?.['data-action'] === 'folder actions') {
    //   return MyDocumentsToggleFolderActions({
    //     ...c.props,
    //     'folder-id': Number(props.folder.id),
    //   });
    // }
    if (c.props?.['data-action'] === 'upload') {
      return (
        <RxFileUploader buttonClassName='bg-transparent w-10 h-10 p-0' className='w-10 h-10' data={{ document_id: props.folder.id }}>
          {c}
        </RxFileUploader>
      );
    }
    if (c.props?.['data-group'] === 'files') {
      const { data: documents } = props.folder.document_uploads;

      if (documents?.length) {
        return (
          <>
            {documents.map(doc =>
              cloneElement(
                c,
                { className: `group/edit-${doc.id}` },
                <FileRexifier
                  {...props}
                  file={{
                    id: Number(doc.id),
                    file_name: doc.attributes.file_name,
                  }}
                >
                  {c.props.children}
                </FileRexifier>,
              ),
            )}
          </>
        );
      }
      return <></>;
    }
    if (c.props?.children) {
      if (className.includes('close-link-right')) {
        return cloneElement(
          <button type='button' {...c.props} className={classNames(className, styles['close-link-right'])} href={undefined} />,
          {},
          c.props.children,
        );
      }
      if (className.includes('icon')) {
        return props['is-creating'] ? cloneElement(c, {}, <SpinningDots className='w-5 h-5 fill-neutral-500' />) : c;
      }
      if (className.includes('doc-folder-dropdown')) {
        return cloneElement(c, { className: classNames(className, props['show-actions'] ? 'w--open' : '') });
      }
      if (typeof c.props.children !== 'string')
        return cloneElement(
          c,
          { className },
          <Rexifier {...c.props} {...props}>
            {c.props.children}
          </Rexifier>,
        );

      if (className.includes('w-button') && typeof c.props.children === 'string') {
        const { href, ...attr } = c.props;
        return cloneElement(<button type='button' className={className} data-href={href} />, {}, c.props.children);
      }
    }
    return c;
  });
  return <>{Rexified}</>;
}
