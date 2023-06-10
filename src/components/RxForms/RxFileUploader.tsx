import axios from 'axios';
import { saveDocumentUpload } from '@/_utilities/api-calls/call-documents';
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import { EventsData, NotificationMessages } from '@/_typings/events';
import styles from './RxFileUploader.module.scss';
import { getUploadUrl } from '@/_utilities/api-calls/call-uploader';

type FileUploaderProps = {
  className: string;
  buttonClassName?: string;
  accept?: string;
  children: ReactNode;
  uploadHandler?: (full_path: string, file: File) => Promise<void>;
  data: {
    [key: string]: string | number;
  };
  ['event-name']?: Events;
};
function RxFileUploader({ accept, buttonClassName, className, children, data, uploadHandler, ...etc }: FileUploaderProps) {
  const handler = useEvent(etc['event-name'] || Events.Blank);
  const { fireEvent } = useEvent(Events.SystemNotification);
  const file_input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [is_uploading, toggleUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (file_input.current) {
      file_input.current.click();
    }
  };

  useEffect(() => {
    if (file) {
      try {
        if (data.folder_file_name) {
          toggleUploading(true);
          if (uploadHandler) uploadHandler(data.folder_file_name as string, file);
          if (etc['event-name']) {
            getUploadUrl(`${data.folder_file_name}.${file.name.split('.').pop()}`, file).then(({ upload_url }) => {
              handler.fireEvent({
                file,
                preview: URL.createObjectURL(file),
                upload_url,
              } as unknown as EventsData);
            });
          }
        } else if (data.document_id) {
          toggleUploading(true);
          saveDocumentUpload(Number(data.document_id), {
            file,
            name: file.name,
            type: file.type,
            size: file.size,
          }).then(({ document_upload }) => {
            axios
              .put(document_upload.upload_url, file, {
                headers: {
                  'Content-Type': file.type,
                },
              })
              .then(() => {
                setFile(undefined);
                fireEvent({
                  category: NotificationCategory.SUCCESS,
                  message: NotificationMessages.DOC_UPLOAD_COMPLETE,
                  timeout: 5000,
                });
              });
          });
        }
      } catch (e) {
        console.log('error');
        console.log(e);
      } finally {
        toggleUploading(false);
      }
    }
  }, [file]);

  return (
    <div className={`${className} overflow-hidden relative`}>
      <input type='file' ref={file_input} accept={accept || ''} onChange={handleFileChange} className={styles.fileInput} />

      <button type='button' onClick={handleUploadClick} className={buttonClassName || `bg-transparent bg-contain w-8 h-8 ${is_uploading ? 'cursor-wait' : ''}`}>
        {children}
      </button>
    </div>
  );
}

export default RxFileUploader;
