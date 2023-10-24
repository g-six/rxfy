import { Children, KeyboardEvent, MouseEvent, ReactElement, cloneElement, useEffect, useState } from 'react';
import { AgentData } from '@/_typings/agent';
import { classNames } from '@/_utilities/html-helper';
import Cookie from 'js-cookie';
import SpinningDots from '@/components/Loaders/SpinningDots';
import { getUploadUrl, invalidateAgentFile } from '@/_utilities/api-calls/call-uploader';
import useEvent, { Events, NotificationCategory } from '@/hooks/useEvent';
import RxFileUploader from '@/components/RxForms/RxFileUploader';
import axios from 'axios';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';

async function uploadImages(full_file_path: string, file: File) {
  return await getUploadUrl(`${full_file_path}.${file.name.split('.').pop()}`, file);
}

function Iterate({
  children,
  ...props
}: {
  children: ReactElement;
  agent: AgentData;
  metatags?: FormValues;
  disabled?: boolean;
  loading?: boolean;
  onChange(evt: KeyboardEvent<HTMLInputElement>): void;
  onSubmit(evt: MouseEvent<HTMLButtonElement>): void;
  replaceMedia(file: File, upload_url: string): void;
}) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props.id === 'headshot' && props.metatags?.headshot) {
        return cloneElement(
          c,
          {
            style: {
              backgroundImage: `url(${getImageSized(props.metatags.headshot, 300)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'none',
            },
          },
          <></>,
        );
      } else if (c.props.id === 'profile_image' && props.metatags?.profile_image) {
        return cloneElement(
          c,
          {
            style: {
              backgroundImage: `url(${getImageSized(props.metatags.profile_image, 300)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'none',
            },
          },
          <></>,
        );
      } else if (c.props.id === 'logo_for_light_bg' && props.metatags?.logo_for_light_bg) {
        return cloneElement(
          c,
          {
            style: {
              backgroundImage: `url(${getImageSized(props.metatags.logo_for_light_bg, 300)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'none',
            },
          },
          <></>,
        );
      } else if (c.props.id === 'logo_for_dark_bg' && props.metatags?.logo_for_dark_bg) {
        return cloneElement(
          c,
          {
            style: {
              backgroundImage: `url(${getImageSized(props.metatags.logo_for_dark_bg, 300)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'none',
            },
          },
          <></>,
        );
      } else if (c.props['event-name']?.includes('evt-upload-')) {
        return (
          <RxFileUploader
            className=''
            buttonClassName={`${c.props.className} w-full`}
            data={{
              folder_file_name: `${props.agent.agent_id}/${c.props['event-name'].split('evt-upload-').pop()}`,
            }}
            uploadHandler={async (folder_file_name, file) => {
              const { upload_url } = await uploadImages(folder_file_name, file);
              props.replaceMedia(file, upload_url);
            }}
            accept='.jpg,.jpeg,.png'
            event-name={c.props['event-name']}
          >
            {c.props.children}
          </RxFileUploader>
        );
      } else if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        return cloneElement(c, {}, <Iterate {...props}>{sub}</Iterate>);
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
  headshot?: string;
  profile_image?: string;
  logo_for_light_bg?: string;
  logo_for_dark_bg?: string;
}
export default function TabBrandPreferences({ children, ...props }: { agent: AgentData; children: ReactElement }) {
  const [data, setData] = useState<FormValues & { id?: number }>({});
  const [is_loading, toggleLoading] = useState<boolean>(false);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  useEffect(() => {
    if (is_loading && data) {
      const session_key = Cookie.get('session_key');

      if (session_key && props.agent.metatags?.id) {
        updateAccount(
          session_key,
          {
            metatags: {
              id: Number(props.agent.metatags.id),
              ...data,
            },
          },
          true,
        )
          .then(() => {
            notify({
              timeout: 10000,
              category: NotificationCategory.SUCCESS,
              message: 'Great, brand preferences all set!',
            });
          })
          .finally(() => {
            toggleLoading(false);
          });
      }
    }
  }, [is_loading]);

  useEffect(() => {
    const { metatags } = props.agent as unknown as {
      metatags?: FormValues & { id?: number };
    };
    if (metatags?.id) {
      let record: Record<string, unknown> = {};
      Object.keys(metatags).forEach(k => {
        const value = (metatags as Record<string, unknown>)[k];
        if (value && ['logo_for_dark_bg', 'logo_for_light_bg', 'profile_image', 'headshot'].includes(k)) {
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
        metatags={data}
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
        replaceMedia={(file, upload_url) => {
          const s3_object_path = new URL(upload_url).pathname;
          axios
            .put(upload_url, file, {
              headers: {
                'Content-Type': file.type,
              },
            })
            .then(upload_xhr => {
              if (upload_xhr.status === 200) {
                if (s3_object_path.includes('dark-bg'))
                  setData({
                    ...data,
                    logo_for_dark_bg: `https:/${s3_object_path}`,
                  });
                else if (s3_object_path.includes('light-bg'))
                  setData({
                    ...data,
                    logo_for_light_bg: `https:/${s3_object_path}`,
                  });
                else if (s3_object_path.includes('profile'))
                  setData({
                    ...data,
                    profile_image: `https:/${s3_object_path}`,
                  });
                else if (s3_object_path.includes('headshot'))
                  setData({
                    ...data,
                    headshot: `https:/${s3_object_path}`,
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
