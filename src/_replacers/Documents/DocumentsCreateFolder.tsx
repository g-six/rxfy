import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { AgentData } from '@/_typings/agent';
import { DocumentInterface } from '@/_typings/document';
import { saveDocument } from '@/_utilities/api-calls/call-documents';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import useEvent, { Events } from '@/hooks/useEvent';
import React, { ChangeEvent, Dispatch, ReactElement, SetStateAction, cloneElement, createElement, useEffect, useState } from 'react';

type Props = {
  child: ReactElement;
  agent_data: AgentData;
  setDocuments: Dispatch<SetStateAction<any[]>>;
};

export default function DocumentsCreateFolder({ child, agent_data, setDocuments }: Props) {
  const [show, setShow] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const event = useEvent(Events.CreateDocFolderShow);
  const handleClose = () => {
    setFolderName('');
    event.fireEvent({ show: false });
  };
  const searcFor = [
    { searchFn: searchByClasses(['icon-5', 'w-embed']), elementName: 'icon' },
    { searchFn: searchByClasses(['input-placeholder']), elementName: 'placeholder' },
    { searchFn: searchByClasses(['new-doc-input']), elementName: 'input' },
    { searchFn: searchByClasses(['new-dr-create']), elementName: 'submit' },
  ];
  const inputElements = captureMatchingElements(child, searcFor);
  const matches = [
    {
      searchFn: searchByClasses(['new-doc-div']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { style: { display: show ? 'flex' : 'none' } });
      },
    },
    {
      searchFn: searchByClasses(['new-dr-close']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: handleClose,
        });
      },
    },
    {
      searchFn: searchByClasses(['input-row']),
      transformChild: (child: ReactElement) => {
        const input = createElement('input', {
          //   className: child.props.className,
          key: '012123',
          type: 'text',
          value: folderName,
          onChange: (e: ChangeEvent<HTMLInputElement>) => {
            setFolderName(e.currentTarget.value);
          },
          className: inputElements.input.props.className,
          placeholder: inputElements?.placeholder?.props?.children?.toString() ?? '',
          style: { position: 'absolute', inset: '0 0 0 0', width: '100%', height: '100%', padding: '6px 6px 6px 28px', zIndex: 0 },
        });

        const inputWrapper = createElement(
          'div',
          { className: 'input-wrapper', key: '0213123', style: { position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' } },
          [cloneElement(inputElements.icon, { style: { position: 'relative', marginLeft: '6px', zIndex: 1 } }), input],
        );
        return cloneElement(child, {}, [
          inputWrapper,
          cloneElement(inputElements.submit, {
            onClick: () => {
              saveDocument(agent_data, folderName).then((res: { document: DocumentInterface }) => {
                console.log(res.document);
                handleClose();
                setDocuments(prev => [...prev, res.document]);
              });
            },
          }),
        ]);
      },
    },
  ];

  useEffect(() => {
    setShow(event?.data?.show ?? false);
  }, [event]);
  return <>{transformMatchingElements(child, matches)}</>;
}
