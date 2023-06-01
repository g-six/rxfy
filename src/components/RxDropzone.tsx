import React, { ReactElement, ReactNode } from 'react';
import { DropzoneOptions, DropEvent, Accept, FileRejection } from 'react-dropzone';

import { useDropzone } from 'react-dropzone';
interface ImagePreview extends File {
  preview: string;
}
type Props = {
  className: string;
  initImgSrc?: string;
  onFileUpload: (newFiles: ImagePreview[]) => void;
  inputId: string;
  fieldId?: string;
  noClick?: boolean;
  children: ReactElement[] | ReactNode;
  // placeholder: PropTypes.element,
  // style: PropTypes.object,
};

export default function RxDropzone({ className, onFileUpload, inputId, noClick = false, children }: Props) {
  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => {
      onFileUpload(
        acceptedFiles.map((file: File) =>
          Object.assign(file, {
            added: Date.now(),
            preview: URL.createObjectURL(file),
          }),
        ),
      );
    },
    [onFileUpload],
  );

  const opts: DropzoneOptions = {
    noClick,
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/svg+xml': ['.svg'],
    },
    // maxFiles: 20,
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone(opts);
  const rootOpts = {};
  //   if (style) rootOpts.style = style;

  return (
    <div
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        const role = target.getAttribute('role');

        if (role === 'button') {
          open();
        }
      }}
    >
      <div {...getRootProps(rootOpts)} className={` dropzoneWrapper ${className} cursor-pointer`}>
        <input id={inputId} {...getInputProps()} />
        {children}
      </div>
    </div>
  );
}
