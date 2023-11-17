import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { AgentData } from '@/_typings/agent';
import { DocumentInterface } from '@/_typings/document';
import { createFolder } from '@/_utilities/api-calls/call-documents';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import useEvent, { Events } from '@/hooks/useEvent';
import React, { ChangeEvent, Dispatch, ReactElement, SetStateAction, cloneElement, createElement, useEffect, useState } from 'react';

type Props = {
  child: ReactElement;
  agent_data: AgentData;
  'agent-customer'?: number;
  setDocuments: Dispatch<SetStateAction<any[]>>;
};

export default function DocumentsCreateFolder({ child, agent_data, setDocuments, ...o }: Props) {
  const [show, setShow] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const event = useEvent(Events.CreateDocFolderShow);
  const handleClose = () => {
    setFolderName('');
    event.fireEvent({ show: false });
  };
  const createNewDocFolder = () => {
    createFolder(agent_data, folderName, o['agent-customer']).then((res: { document: DocumentInterface }) => {
      handleClose();
      setDocuments(prev => [...prev, res.document]);
    });
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
      //new folder popup
      searchFn: searchByClasses(['new-doc-div']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, { style: { display: show ? 'flex' : 'none' } });
      },
    },
    {
      //new folder popup close icon
      searchFn: searchByClasses(['new-dr-close']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {
          onClick: handleClose,
        });
      },
    },
    {
      //transforming 'input-like' div to real input
      searchFn: searchByClasses(['input-row']),
      transformChild: (child: ReactElement) => {
        const input = createElement('input', {
          //   className: child.props.className,
          key: '012123',
          type: 'text',
          value: folderName,
          onKeyUp: (e: KeyboardEvent) => {
            if (e.code === 'Enter') {
              createNewDocFolder();
            }
          },
          onChange: (e: ChangeEvent<HTMLInputElement>) => {
            setFolderName(e.currentTarget.value);
          },
          className: inputElements.input.props.className,
          placeholder: inputElements?.placeholder?.props?.children?.toString() ?? '',
          style: { position: 'absolute', inset: '0 0 0 0', width: '100%', height: '100%', padding: '6px 6px 6px 28px', zIndex: 0 },
        });

        const input_elements: React.ReactElement[] = [];
        if (inputElements?.icon) input_elements.push(cloneElement(inputElements.icon, { style: { position: 'relative', marginLeft: '6px', zIndex: 1 } }));
        input_elements.push(input);
        const inputWrapper = createElement(
          'div',
          { className: 'input-wrapper', key: '0213123', style: { position: 'relative', width: '100%', display: 'flex', alignItems: 'center' } },
          input_elements,
        );
        if (inputElements?.submit)
          return cloneElement(child, {}, [
            inputWrapper,
            cloneElement(inputElements?.submit, {
              //getting sumbit work
              onClick: createNewDocFolder,
            }),
          ]);
        return child;
      },
    },
  ];

  useEffect(() => {
    setShow(event?.data?.show ?? false);
  }, [event]);
  return <>{transformMatchingElements(child, matches)}</>;
}
