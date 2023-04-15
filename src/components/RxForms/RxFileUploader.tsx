import axios from 'axios';
import { saveDocumentUpload } from '@/_utilities/api-calls/call-documents';
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import { NotificationMessages } from '@/_typings/events';

type FileUploaderProps = {
  className: string;
  children: ReactNode;
  data: {
    [key: string]: string | number;
  };
};
function RxFileUploader({ className, children, data }: FileUploaderProps) {
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
    if (file && data.document_id) {
      toggleUploading(true);
      try {
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
      <input type='file' ref={file_input} onChange={handleFileChange} className='absolute sr-only' />

      <button onClick={handleUploadClick} className={`bg-transparent bg-contain w-8 h-8 ${is_uploading ? 'cursor-wait' : ''}`}>
        {children}
      </button>
    </div>
  );
}

export default RxFileUploader;
