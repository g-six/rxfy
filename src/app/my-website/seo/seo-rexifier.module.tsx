'use client';
import { Children, ReactElement, SyntheticEvent, cloneElement, useEffect, useState } from 'react';
import { AgentData, AgentMetatags } from '@/_typings/agent';
import RxFileUploader from '@/components/RxForms/RxFileUploader';
import styles from '@/rexify/my-website.module.scss';
import useEvent, { Events, EventsData, NotificationCategory } from '@/hooks/useEvent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { RxButton } from '@/components/RxButton';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import Cookies from 'js-cookie';
import axios from 'axios';

type ImageUpload = {
  upload_url?: string;
  url?: string;
  file?: File;
  preview?: string;
};
type ImageSet = {
  og?: string;
  favicon?: string;
};

enum UploadFor {
  LINK_IMAGE = 'cta-link-image-preview-upload',
  FAVICON = 'cta-favicon-image-upload',
  WEBCLIP = 'cta-webclip-image-upload',
}

function Rexify({
  children,
  ...props
}: {
  children: ReactElement;
  images: ImageSet;
  onUpload(upload_for: UploadFor, file_full_path: string, file: File): void;
  onTextChange(key: string, value: string): void;
  'form-data': AgentMetatags;
  'agent-id': string;
  'form-state': 'loading' | 'enabled' | 'disabled';
}) {
  const Rexified = Children.map(children, c => {
    const { className, children: sub, placeholder } = c.props || {};
    const { ogimage_url, favicon } = props['form-data'];
    if (className?.includes('thumbnail-wrapper')) {
      let backgroundImage = 'none';
      switch (c.props.id) {
        case 'ogimage_url':
          if (ogimage_url) {
            backgroundImage = `url('${getImageSized(ogimage_url, 128)}')`;
          }
          if (props.images.og) backgroundImage = `url(${props.images.og})`;
          break;
        case 'favicon':
          if (favicon) {
            backgroundImage = `url('${getImageSized(favicon, 128)}')`;
          }
          if (props.images.favicon) backgroundImage = `url(${props.images.favicon})`;
          break;
      }

      return cloneElement(
        c,
        {
          className: className + ' bg-cover bg-center bg-no-repeat',
          style: {
            backgroundImage,
          },
        },
        backgroundImage === 'none' ? sub : <></>,
      );
    }

    if (placeholder) {
      switch (placeholder.toLowerCase()) {
        case 'site title':
          return cloneElement(c, {
            value: props['form-data'].title,
            onChange: (evt: SyntheticEvent<HTMLInputElement>) => {
              props.onTextChange('title', evt.currentTarget.value);
            },
          });
        case 'description meta tags':
          return cloneElement(c, {
            onChange: (evt: SyntheticEvent<HTMLInputElement>) => {
              props.onTextChange('description', evt.currentTarget.value);
            },
            value: props['form-data'].description,
          });
      }
    }

    if (c.type === 'a' && className) {
      let event_name;
      let upload_for: unknown = null;

      if (className.includes(UploadFor.LINK_IMAGE)) {
        event_name = Events.UploadOGImage;
        upload_for = UploadFor.LINK_IMAGE as UploadFor;
      }

      if (className.includes(UploadFor.FAVICON)) {
        event_name = Events.UploadFavicon;
        upload_for = UploadFor.FAVICON as UploadFor;
      }

      if (className.includes('cta-save-seo')) {
        return (
          <RxButton
            id={Events.UpdateWebsite + '-trigger'}
            rx-event={Events.UpdateWebsite}
            className={className}
            type='button'
            disabled={props['form-state'] === 'disabled'}
            loading={true}
          >
            {sub}
          </RxButton>
        );
      }

      if (upload_for && event_name) {
        return (
          <RxFileUploader
            className={[className, styles.uploadFileBrowserTrigger].join(' ')}
            buttonClassName={styles.uploadButton}
            data={{
              folder_file_name: `${props['agent-id']}/${((u: UploadFor) => {
                switch (upload_for) {
                  case UploadFor.FAVICON:
                    return 'favicon';
                  case UploadFor.LINK_IMAGE:
                    return 'ogimage';
                  default:
                    return 'webclip';
                }
              })(upload_for as UploadFor)}`,
            }}
            uploadHandler={async (folder_file_name, file: File) => {
              props.onUpload(upload_for as UploadFor, folder_file_name, file);
            }}
            accept='.jpg,.jpeg,.png,.gif'
            event-name={event_name}
          >
            {sub}
          </RxFileUploader>
        );
      }
    }

    if (sub && typeof sub.children !== 'string') {
      return cloneElement(c, {}, <Rexify {...props}>{sub}</Rexify>);
    }
    return c;
  });
  return <>{Rexified}</>;
}

export default function RxSearchEngineOptimizationTab({ children, realtor }: { children: ReactElement; realtor: AgentData }) {
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const { data, fireEvent: updateForm } = useEvent(Events.UpdateWebsite);
  const { data: ogimage_event_data, fireEvent: replaceOGImage } = useEvent(Events.UploadOGImage);
  const { data: favicon_event_data, fireEvent: replaceFavicon } = useEvent(Events.UploadFavicon);
  const [form_data, setFormData] = useState<AgentMetatags>(realtor.metatags);
  const [images, setImages] = useState<ImageSet>({});
  const [button_state, toggleSaveButton] = useState<'disabled' | 'loading' | 'enabled'>('disabled');

  const handleTextChange = (key: string, value: string) => {
    setFormData({
      ...form_data,
      [key]: value,
    });
  };

  const handleUpload = (upload_for: UploadFor, file_full_path: string, file: File) => {};

  useEffect(() => {
    const { preview: og, file, upload_url } = ogimage_event_data as unknown as ImageUpload;

    if (og) {
      setImages({
        ...images,
        og,
      });
    }
  }, [ogimage_event_data]);
  useEffect(() => {
    const { preview: favicon } = favicon_event_data as unknown as {
      preview: string;
    };

    if (favicon) {
      setImages({
        ...images,
        favicon,
      });
    }
  }, [favicon_event_data]);

  // Check if form is modified
  useEffect(() => {
    const { title, description, clicked } = data as unknown as {
      title: string;
      description: string;
      clicked: string;
    };
    let updated = false;
    if (form_data.title !== title) {
      updated = true;
    }
    if (!updated && form_data.description !== description) {
      updated = true;
    }
    if (updated) {
      if (clicked === Events.UpdateWebsite + '-trigger' && button_state !== 'loading') {
        toggleSaveButton('loading');
      } else toggleSaveButton('enabled');
    } else {
      toggleSaveButton('disabled');
    }
  }, [form_data, data]);

  useEffect(() => {
    if (button_state === 'loading') {
      if (realtor.metatags.id) {
        const { title, description } = form_data;
        let { ogimage_url, favicon } = form_data;
        if (ogimage_event_data) {
          const { file, upload_url } = ogimage_event_data as unknown as ImageUpload;
          if (upload_url && file?.type) {
            axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });
            ogimage_url = 'https://' + upload_url.split('amazonaws.com/')[1].split('?')[0];
          }
        }
        if (favicon_event_data) {
          const { file, upload_url } = favicon_event_data as unknown as ImageUpload;
          if (upload_url && file?.type) {
            axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });
            favicon = 'https://' + upload_url.split('amazonaws.com/')[1].split('?')[0];
          }
        }
        updateAccount(
          Cookies.get('session_key') as string,
          {
            metatags: {
              id: realtor.metatags.id,
              title,
              description,
              ogimage_url,
              favicon,
            },
          },
          true,
        )
          .then(() => {
            toggleSaveButton('disabled');
          })
          .finally(() => {
            updateForm({
              ...data,
              clicked: undefined,
            });
            notify({
              category: NotificationCategory.SUCCESS,
              message: 'You SEO settings have been updated.',
              timeout: 3500,
            });
          });
      } else {
        toggleSaveButton('disabled');
      }
    }
  }, [button_state]);

  return (
    <Rexify form-data={form_data} agent-id={realtor.agent_id} onTextChange={handleTextChange} onUpload={handleUpload} images={images} form-state={button_state}>
      {children}
    </Rexify>
  );
}
