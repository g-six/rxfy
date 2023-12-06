import { getDocumentSignedUrl, removeDocumentUpload } from '@/_utilities/api-calls/call-documents';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { MouseEvent, ReactElement, useEffect } from 'react';
import MyDocumentsPreviewDocumentDialog from './preview.dialog';

export function MyDocumentsDownloadDocumentButton(p: { 'file-name': string; children: ReactElement }) {
  return (
    <button
      type='button'
      className='bg-transparent p-0'
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        getDocumentSignedUrl(p['file-name']).then(url => {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.setAttribute('download', 'true');
          document.body.append(a);
          a.click();
          a.remove();
        });
      }}
    >
      {p.children}
    </button>
  );
}
export function MyDocumentsPreviewDocumentButton(p: { 'file-name': string; children: ReactElement; onLoad(url: string): void }) {
  return (
    <button
      type='button'
      className='bg-transparent p-0'
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        getDocumentSignedUrl(p['file-name']).then(p.onLoad);
      }}
    >
      {p.children}
    </button>
  );
}

export function MyDocumentsDeleteDocumentButton(p: { 'file-id': number; children: ReactElement }) {
  const { data: confirmation, fireEvent: confirmDelete } = useEvent(Events.GenericEvent);
  const { fireEvent: reloadFolders } = useEvent(Events.DocFolderShow);
  const deleteDocumentUpload = () => {
    confirmDelete({
      id: Number(p['file-id']),
    } as unknown as EventsData);
  };

  useEffect(() => {
    if (confirmation) {
      const { id, confirm } = confirmation as unknown as { id: number; confirm: boolean };
      if (id && confirm) {
        removeDocumentUpload(id)
          .then(console.log)
          .finally(() => {
            reloadFolders({
              reload: true,
            });
            confirmDelete({});
          });
      }
    }
  }, [confirmation]);

  return (
    <button
      type='button'
      className='bg-transparent p-0'
      data-id={p['file-id']}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        deleteDocumentUpload();
      }}
    >
      {p.children}
    </button>
  );
}
