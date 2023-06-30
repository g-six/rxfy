import React from 'react';
import { AgentData } from '@/_typings/agent';
import RxFileUploader from '@/components/RxForms/RxFileUploader';
import { invalidateAgentFile } from '@/_utilities/api-calls/call-uploader';
import { Events } from '@/hooks/useFormEvent';
import useEvent from '@/hooks/useEvent';
import axios, { AxiosResponse } from 'axios';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import Cookies from 'js-cookie';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

interface Props extends React.ReactElement {
  className?: string;
  children: React.ReactElement;
  session: AgentData;
}

type FileUpload = {
  file: File;
  upload_url?: string;
  preview?: string;
};

export type BrandUploads = {
  [key: string]: FileUpload;
};

export default function RxBrandPreferences(p: Props) {
  const [is_uploading, toggleUploading] = React.useState<boolean>(false);
  const [queue, setUploadQueue] = React.useState<Promise<AxiosResponse>[]>([]);
  const { data: headshot, fireEvent: evtH } = useEvent(Events.UploadHeadshot);
  const { data: profile_image, fireEvent: evtP } = useEvent(Events.UploadProfileImage);
  const { data: logo_for_dark_bg, fireEvent: evtL } = useEvent(Events.UploadLogoForDarkBg);
  const { data: logo_for_light_bg, fireEvent: evtD } = useEvent(Events.UploadLogoForLightBg);
  const { data: brand_updates, fireEvent: updateBrandPreferences } = useEvent(Events.UpdateBrandPreferences);
  const uploads = {
    headshot: headshot as unknown as FileUpload,
    profile_image: profile_image as unknown as FileUpload,
    logo_for_dark_bg: logo_for_dark_bg as unknown as FileUpload,
    logo_for_light_bg: logo_for_light_bg as unknown as FileUpload,
  };
  const { session, className, ...props } = p;
  if (brand_updates?.clicked && !is_uploading) {
    toggleUploading(true);
    setUploadQueue([]);
    // if (uploads.headshot.file || uploads.profile_image.file || uploads.logo_for_dark_bg.file || uploads.logo_for_light_bg.file) {
    //   const u = uploads as unknown as { [key: string]: { [key: string]: unknown } };
    //   Object.keys(u).map(obj_name => {
    //     console.log('Queueing');
    //     console.log(u[obj_name]);
    //   });
    // }
  }

  React.useEffect(() => {
    if (is_uploading && queue.length === 0) {
      toggleUploading(false);
      if (uploads.headshot.file || uploads.profile_image.file || uploads.logo_for_dark_bg.file || uploads.logo_for_light_bg.file) {
        const u = uploads as unknown as { [key: string]: { [key: string]: unknown } };
        let q: Promise<AxiosResponse>[] = Object.keys(u)
          .filter(obj_name => u[obj_name].file && u[obj_name].upload_url)
          .map(obj_name => {
            const { upload_url, file } = u[obj_name] as FileUpload;
            console.log('Queueing', obj_name);
            if (upload_url) {
              const s3_object_path = new URL(upload_url).pathname;

              updateBrandPreferences({
                [obj_name]: 'https:/' + s3_object_path,
              });
              invalidateAgentFile([s3_object_path.split('/pages.leagent.com').pop() as string]);
            }
            return axios.put(upload_url as string, file, {
              headers: {
                'Content-Type': file.type,
              },
            });
          });
        if (q.length) {
          setUploadQueue(q);
        }
      }
      updateBrandPreferences({
        clicked: undefined,
      });
    }
  }, [is_uploading]);

  React.useEffect(() => {
    if (queue.length > 0) {
      setUploadQueue([]);
      let completed = 0;
      Promise.all(queue).then(queue_done => {
        // toggleUploading(false);
        queue_done.map(upload_xhr => {
          if (upload_xhr.status === 200) completed++;
          if (completed === queue.length) {
            const { headshot, profile_image, logo_for_dark_bg, logo_for_light_bg } = brand_updates as unknown as { [key: string]: string };
            updateAccount(
              Cookies.get('session_key') as string,
              {
                metatags: {
                  id: Number(p.session.metatags.id),
                  headshot,
                  profile_image,
                  logo_for_dark_bg,
                  logo_for_light_bg,
                },
              },
              true,
            );
          }
        });
      });
    }
  }, [queue]);

  return (
    <div {...props} className={`${className} rexified`}>
      <Iterator {...p} uploads={uploads} session={session}>
        {p.children}
      </Iterator>
    </div>
  );
}

function Iterator(props: Props & { uploads?: BrandUploads }) {
  const { uploads, session } = props;

  const wrappedChildren = React.Children.map(props.children, (child: React.ReactElement) => {
    if (child.props?.['event-name'] && child.props?.className.indexOf('upload-button') >= 0) {
      return (
        <RxFileUploader
          className=''
          buttonClassName={`${child.props.className} w-full`}
          data={{
            folder_file_name: `${session.agent_id}/${child.props['event-name'].split('-').slice(2).join('-')}`,
          }}
          accept='.jpg,.jpeg,.png'
          event-name={child.props['event-name']}
        >
          {child.props.children}
        </RxFileUploader>
      );
    } else if (child.props?.children && child.type === 'div') {
      if (child.props.id) {
        if (uploads?.[child.props.id].preview) {
          const upload = uploads?.[child.props.id];

          return React.cloneElement(child, {
            className: child.props.className + ` bg-cover bg-center`,
            children: [],
            style: {
              backgroundImage: `url(${upload.preview})`,
            },
          });
        } else if (session.metatags) {
          const metatags = session.metatags as unknown as {
            [key: string]: string;
          };

          if (metatags[child.props.id]) {
            return React.cloneElement(child, {
              className: child.props.className + ` bg-cover bg-center`,
              children: [],
              style: {
                backgroundImage: `url(${getImageSized(metatags[child.props.id], 192)})`,
              },
            });
          }
        }
      }
      return React.cloneElement(
        {
          ...child,
        },
        {
          ...child.props,
          agent: session.agent_id,
          children: (
            <Iterator {...child.props} session={session} uploads={uploads}>
              {child.props.children}
            </Iterator>
          ),
        },
      );
    }
    return child;
  });
  return <>{wrappedChildren}</>;
}
