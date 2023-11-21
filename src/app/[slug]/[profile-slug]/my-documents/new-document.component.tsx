import { classNames } from '@/_utilities/html-helper';
import { ChangeEvent, ChangeEventHandler, Children, KeyboardEvent, KeyboardEventHandler, ReactElement, cloneElement, useEffect, useState } from 'react';
import styles from './new-document.module.scss';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import SpinningDots from '@/components/Loaders/SpinningDots';
import { createFolder } from '@/_utilities/api-calls/call-documents';
import { AgentData } from '@/_typings/agent';
import { CustomerRecord } from '@/_typings/customer';

interface Props {
  agent: AgentData;
  customer: CustomerRecord;
  children: ReactElement;
  className?: string;
}

export default function MyDocumentsNewDocumentComponent({ children, className: elementClassName, ...props }: Props) {
  const evt = useEvent(Events.CreateDocFolderShow);
  const { fireEvent: reloadFolders } = useEvent(Events.DocFolderShow);
  const className = `${elementClassName || ''} rx-MyDocumentsNewDocumentComponent`.trim();
  const [is_creating, toggleCreating] = useState(false);
  return (
    <Rexifier
      className={className}
      {...props}
      onInputChange={({ currentTarget }: ChangeEvent<HTMLInputElement>) => {
        evt.fireEvent({
          name: currentTarget.value,
        } as unknown as EventsData);
      }}
      onSubmit={() => {
        const { name: folder_name } = evt.data as unknown as {
          name: string;
        };
        if (folder_name) {
          toggleCreating(true);
          createFolder(props.agent, folder_name)
            .then(console.log)
            .finally(() => {
              toggleCreating(false);
              evt.fireEvent({});
              reloadFolders({
                reload: true,
              });
            });
        }
      }}
      is-creating={is_creating}
    >
      {evt.data?.show ? children : <></>}
    </Rexifier>
  );
}

function Rexifier({ children, className, ...props }: Props & { 'is-creating'?: boolean; onInputChange: ChangeEventHandler; onSubmit(): void }) {
  const Rexified = Children.map(children, c => {
    let className = `${c.props?.className || ''} rx-my-documents rx-new-document-component`;
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
      if (typeof c.props.children !== 'string')
        return cloneElement(
          c,
          { className },
          <Rexifier {...c.props} {...props}>
            {c.props.children}
          </Rexifier>,
        );
      if (className.includes('input-placeholder')) {
        return (
          <input
            type='text'
            className={classNames(className, styles['new-document-name'])}
            placeholder={c.props.children && typeof c.props.children === 'string' ? c.props.children : ''}
            onChange={props.onInputChange}
            disabled={props['is-creating']}
          />
        );
      }
      if (className.includes('w-button') && typeof c.props.children === 'string') {
        const { href, ...attr } = c.props;
        return cloneElement(<button type='button' className={className} data-href={href} onClick={() => props.onSubmit()} />, {}, c.props.children);
      }
    }
    return c;
  });
  return <>{Rexified}</>;
}
