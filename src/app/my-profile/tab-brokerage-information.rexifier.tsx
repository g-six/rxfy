import { Children, KeyboardEvent, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import Cookie from 'js-cookie';
import SpinningDots from '@/components/Loaders/SpinningDots';
import { getUploadUrl, invalidateAgentFile } from '@/_utilities/api-calls/call-uploader';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import RxFileUploader from '@/components/RxForms/RxFileUploader';
import axios from 'axios';
import { updateBrokerageInformation } from '@/_utilities/api-calls/call-realtor';
import { BrokerageInput } from '@/_typings/brokerage';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { TabProps } from './page.types';

async function uploadBrokerageLogo(full_file_path: string, file: File) {
  return await getUploadUrl(`${full_file_path}.${file.name.split('.').pop()}`, file);
}

function Iterate({
  children,
  ...props
}: {
  children: ReactElement;
  agent: AgentData;
  brokerage?: FormValues;
  disabled?: boolean;
  loading?: boolean;
  onChange(evt: KeyboardEvent<HTMLInputElement>): void;
  onSubmit(evt: MouseEvent<HTMLButtonElement>): void;
  replaceLogo(file: File, upload_url: string): void;
}) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props.id === 'brokerage-logo_url' && props.brokerage?.logo_url) {
        return cloneElement(
          c,
          {
            style: {
              backgroundImage: `url(${getImageSized(props.brokerage.logo_url, 300)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'none',
            },
          },
          <></>,
        );
      } else if (c.props.id === 'btn_upload_brokerage_logo') {
        return (
          <RxFileUploader
            className=''
            buttonClassName={`${c.props.className} w-full`}
            data={{
              folder_file_name: `${props.agent.agent_id}/brokerage-logo`,
            }}
            uploadHandler={async (folder_file_name, file) => {
              const { upload_url } = await uploadBrokerageLogo(folder_file_name, file);
              props.replaceLogo(file, upload_url);
            }}
            accept='.jpg,.jpeg,.png'
            event-name={Events.UploadBrokerageLogo}
          >
            {c.props.children}
          </RxFileUploader>
        );
      } else if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        return cloneElement(c, {}, <Iterate {...props}>{sub}</Iterate>);
      } else if (c.type === 'input' && props.brokerage) {
        const { name, full_address, phone_number, website_url } = props.brokerage;

        switch (c.props.placeholder?.toLowerCase()) {
          case 'brokerage name':
            return cloneElement(c, {
              name: 'name',
              value: name || '',
              onChange: props.onChange,
            });
            break;
          case 'brokerage address':
            return cloneElement(c, {
              name: 'full_address',
              value: full_address || '',
              onChange: props.onChange,
            });
            break;
          case 'brokerage phone':
            return cloneElement(c, {
              name: 'phone_number',
              value: phone_number || '',
              onChange: props.onChange,
            });
            break;
          case 'brokerage website url':
            return cloneElement(c, {
              name: 'website_url',
              value: website_url || '',
              onChange: props.onChange,
            });
            break;
        }
      } else if (typeof c.props.children === 'string' && ['a', 'button'].includes(c.type as string)) {
        const text = c.props.children as string;
        if (text.toLowerCase() === 'save') {
          return cloneElement(
            <button type='button' disabled={props.loading || props.disabled} />,
            {
              ...c.props,
              className: classNames(c.props.className, 'disabled:opacity-50'),
              href: undefined,
              onClick: props.onSubmit,
            },
            <>
              {props.loading && <SpinningDots className='fill-white mr-2' />}
              {c.props.children}
            </>,
          );
        }
      }
    }
    return c;
  });
  return <>{rexified}</>;
}

interface FormValues {
  logo_url?: string;
  name?: string;
  phone_number?: string;
  full_address?: string;
  website_url?: string;
  lat?: number;
  lon?: number;
}
export default function TabBrokerageInformation({ children, ...props }: TabProps) {
  const { data: logo, fireEvent: replaceLogo } = useEvent(Events.UploadBrokerageLogo);
  const [data, setData] = useState<FormValues & { id?: number }>({});
  const [is_loading, toggleLoading] = useState<boolean>(false);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  useEffect(() => {
    if (is_loading && data) {
      const session_key = Cookie.get('session_key');

      if (session_key) {
        updateBrokerageInformation(data as unknown as BrokerageInput)
          .then(brokerage => {
            props.onContentUpdate({
              ...props.agent,
              brokerage: {
                ...props.agent.brokerage,
                ...brokerage,
              },
            });
            setData(brokerage);
            notify({
              timeout: 10000,
              category: NotificationCategory.SUCCESS,
              message: 'Great, brokerage information all set!',
            });
          })
          .finally(() => {
            toggleLoading(false);
          });
      }
    }
  }, [is_loading]);

  useEffect(() => {
    const { brokerage } = props.agent as unknown as {
      brokerage?: FormValues & { id?: number };
    };
    if (brokerage?.id) {
      let record: Record<string, unknown> = {};
      Object.keys(brokerage).forEach(k => {
        const value = (brokerage as Record<string, unknown>)[k];
        if (value) {
          record = {
            ...record,
            [k]: value,
          };
        }
      });
      setData(record);
    }
  }, []);

  return (
    <>
      <Iterate
        {...props}
        agent={props.agent}
        brokerage={data}
        onChange={evt => {
          setData({
            ...data,
            [evt.currentTarget.name]: evt.currentTarget.value,
          });
        }}
        onSubmit={evt => {
          if (
            Object.keys(data).filter(k => {
              const a = props.agent as unknown as {
                [k: string]: string;
              };
              const b = data as unknown as {
                [k: string]: string;
              };
              return a[k] !== b[k];
            }).length
          ) {
            // Has changes
            toggleLoading(true);
          }
        }}
        disabled={
          Object.keys(data).filter(k => {
            const a = props.agent as unknown as {
              [k: string]: string;
            };
            const b = data as unknown as {
              [k: string]: string;
            };
            return a[k] !== b[k];
          }).length === 0
        }
        loading={is_loading}
        replaceLogo={(file, upload_url) => {
          const logo_url = 'https:/' + new URL(upload_url).pathname;
          axios
            .put(upload_url, file, {
              headers: {
                'Content-Type': file.type,
              },
            })
            .then(upload_xhr => {
              if (upload_xhr.status === 200) {
                const s3_object_path = new URL(upload_url).pathname;
                setData({
                  ...data,
                  logo_url: `https:/${s3_object_path}`,
                });
                invalidateAgentFile([s3_object_path.split('/pages.leagent.com').pop() as string]);
              }
            });
        }}
      >
        {children}
      </Iterate>
    </>
  );
}
