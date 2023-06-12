'use client';
import React from 'react';
import { AgentData, AgentMetatagsInput, RealtorInputModel } from '@/_typings/agent';
import { clearSessionCookies } from '@/_utilities/api-calls/call-logout';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import { updateAccount } from '@/_utilities/api-calls/call-update-account';
import useEvent, { Events, EventsData, NotificationCategory } from '@/hooks/useEvent';
import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import styles from './my-website.module.scss';
import { formatAddress } from '@/_utilities/string-helper';
import RxFileUploader from '@/components/RxForms/RxFileUploader';
import { getUploadUrl, invalidateAgentFile } from '@/_utilities/api-calls/call-uploader';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { RxTextInput } from '@/components/RxTextInput';
import { RxButton } from '@/components/RxButton';
import { getCleanObject } from '@/_utilities/data-helpers/key-value-cleaner';

type Props = {
  children: React.ReactElement;
};

function isMetatagForm(className: string) {
  return className.split(' ').filter(c => ['cta-tracking-save', 'cta-save-seo'].includes(c)).length > 0;
}

export function MyWebsite(p: Props) {
  const { fireEvent: loadUserDataIntoEventState } = useEvent(Events.LoadUserSession);
  const { data: acted } = useEvent(Events.SaveUserSession);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const websiteHandler = useEvent(Events.UpdateWebsite);
  const ogimageHandler = useEvent(Events.UploadOGImage);
  const ogimage = ogimageHandler.data as unknown as {
    upload_url?: string;
    file?: File;
  };
  const faviconHandler = useEvent(Events.UploadFavicon);
  const favicon = faviconHandler.data as unknown as {
    upload_url?: string;
    file?: File;
  };

  const [updates, setUpdates] = React.useState<RealtorInputModel | undefined>();
  const [agent, setAgent] = React.useState<AgentData | undefined>();
  React.useEffect(() => {
    if (updates && Cookies.get('session_key')) {
      setUpdates(undefined);
      updateAccount(Cookies.get('session_key') as string, updates as RealtorInputModel, true)
        .then(
          (d: {
            agent?: {
              [key: string]: string;
            };
          }) => {
            loadUserDataIntoEventState(d as unknown as EventsData);
            console.log('Successfully updated', d.agent?.agent_id);
          },
        )
        .catch(console.error);
    }
  }, [updates]);

  React.useEffect(() => {
    const { progress, ...updates } = acted as unknown as { [key: string]: unknown };
    if (progress === 0) {
      setUpdates(updates as unknown as RealtorInputModel);
    }
  }, [acted]);

  React.useEffect(() => {
    if (websiteHandler.data?.clicked && agent) {
      let metatags = getCleanObject(websiteHandler.data);
      websiteHandler.fireEvent({
        clicked: undefined,
      });
      updateAccount(
        Cookies.get('session_key') as string,
        {
          metatags: {
            ...metatags,
            id: agent.metatags.id,
          },
        },
        true,
      )
        .then(() => {
          notify({
            category: NotificationCategory.SUCCESS,
            message: 'Your website updated settings and configuration are set!',
            timeout: 5000,
          });
        })
        .catch(console.error);
    }
  }, [websiteHandler.data]);

  // Let's load up the session
  React.useEffect(() => {
    if (Cookies.get('session_key')) {
      getUserBySessionKey(Cookies.get('session_key') as string, 'realtor')
        .then(data => {
          loadUserDataIntoEventState(data);
          setAgent(data as unknown as AgentData);
        })
        .catch(e => {
          const axerr = e as AxiosError;
          if (axerr.response?.status === 401) {
            clearSessionCookies();
            setTimeout(() => {
              location.href = '/log-in';
            }, 500);
          }
        });
    }
  }, []);

  return (
    <>
      {agent
        ? React.Children.map(p.children, child => {
            return (
              <Iterator {...child.props} element-type={child.type} agent={agent}>
                {child}
              </Iterator>
            );
          })
        : p.children}
    </>
  );
}

async function uploadImage(full_file_path: string, file: File) {
  return await getUploadUrl(`${full_file_path}.${file.name.split('.').pop()}`, file);
}

function Iterator(p: {
  className?: string;
  agent: AgentData;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  type?: string;
  ['element-type']?: string;
  ['event-name']?: string;
  children: React.ReactElement;
}) {
  const { fireEvent: saveValues } = useEvent(Events.SaveUserSession);
  const { data, fireEvent: updateForm } = useEvent(Events.UpdateWebsite);
  const { data: ogimage_event_data, fireEvent: replaceOGImage } = useEvent(Events.UploadOGImage);
  const ogimage = ogimage_event_data as unknown as {
    upload_url?: string;
    file?: File;
  };
  const { data: favicon_event_data, fireEvent: replaceFavicon } = useEvent(Events.UploadFavicon);
  const favicon = favicon_event_data as unknown as {
    upload_url?: string;
    file?: File;
  };
  const [updates, setUpdates] = React.useState(p.agent);

  let theme_name = '';
  let theme_domain = p.agent.webflow_domain;

  if (!updates) return <Iterator {...p}>{p.children}</Iterator>;
  if (updates.webflow_domain) {
    theme_domain = updates.webflow_domain as string;
    theme_name = theme_domain.split('-').reverse().pop() as string;
  }

  if (p.children?.props?.children) {
    if (p.children.type === 'form') {
      return React.cloneElement(<div></div>, {
        ...p,
        children: React.Children.map(p.children.props.children, child => {
          return (
            <Iterator {...child.props} agent={p.agent}>
              {child}
            </Iterator>
          );
        }),
      });
    }
    if (p.children.type === 'a') {
      switch (p.children.props.children) {
        case 'Cancel':
          return (
            <RxButton type='reset' {...p.children.props} id={`${Events.ResetForm}-trigger`} rx-event={Events.ResetForm}>
              {p.children.props.children}
            </RxButton>
          );
        case 'Save':
          return (
            <RxButton {...p.children.props} id={`${Events.UpdateWebsite}-trigger`} rx-event={Events.UpdateWebsite}>
              {p.children.props.children}
            </RxButton>
          );
      }
      if (p.className) {
        if (p.className.indexOf('cta-link-image-preview-upload') >= 0)
          return (
            <RxFileUploader
              className={[p.className, styles.uploadFileBrowserTrigger].join(' ')}
              buttonClassName={styles.uploadButton}
              data={{
                folder_file_name: `${p.agent.agent_id}/ogimage`,
              }}
              uploadHandler={async (folder_file_name, file: File) => {
                const { upload_url } = await uploadImage(`${folder_file_name}`, file);
                replaceOGImage({
                  file,
                  upload_url,
                } as unknown as EventsData);
                if (upload_url) {
                  const ogimage_url = 'http:/' + new URL(upload_url).pathname;
                  updateForm({
                    ogimage_url,
                  } as unknown as EventsData);
                }
              }}
              accept='.jpg,.jpeg,.png'
              event-name={Events.UploadOGImage}
            >
              {p.children.props.children}
            </RxFileUploader>
          );
        if (p.className.indexOf('cta-favicon-image-upload') >= 0)
          return (
            <RxFileUploader
              className={[p.className, styles.uploadFileBrowserTrigger].join(' ')}
              buttonClassName={styles.uploadButton}
              data={{
                folder_file_name: `${p.agent.agent_id}/favicon`,
              }}
              uploadHandler={async (folder_file_name, file: File) => {
                const { upload_url } = await uploadImage(`${folder_file_name}`, file);
                replaceFavicon({
                  file,
                  upload_url,
                } as unknown as EventsData);
                if (upload_url) {
                  const favicon = 'http:/' + new URL(upload_url).pathname;
                  updateForm({
                    favicon,
                  } as unknown as EventsData);
                }
              }}
              accept='.jpg,.jpeg,.png'
              event-name={Events.UploadFavicon}
            >
              {p.children.props.children}
            </RxFileUploader>
          );
      }
    }

    const media_fields = ['ogimage_url', 'favicon'];
    if (p.children.type === 'div' && p.id && media_fields.includes(p.id)) {
      let metatags: { [key: string]: string } = {};
      if (updates.metatags) metatags = updates.metatags as unknown as { [key: string]: string };
      let backgroundImage;

      if (p.id === 'ogimage_url') {
        if (ogimage.file) backgroundImage = `url(${URL.createObjectURL(ogimage.file)})`;
        if (p.agent.metatags?.ogimage_url) backgroundImage = `url(${getImageSized(p.agent.metatags.ogimage_url, 128)})`;
      }
      if (p.id === 'favicon') {
        if (favicon.file) backgroundImage = `url(${URL.createObjectURL(favicon.file)})`;
        if (p.agent.metatags?.favicon) backgroundImage = `url(${getImageSized(p.agent.metatags?.favicon, 128)})`;
      }

      switch (p.id) {
        case 'ogimage_url':
        case 'favicon':
        case 'webclip':
          return React.cloneElement(<UploadsThumbnail {...p.children.props} />, {
            className: [p.children.props.className, backgroundImage && styles.hasValue].join(' '),
            style: {
              backgroundImage,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            },
          });
      }
    }

    if (p.children.type === 'div' && p.id && p.id.indexOf('-leagent-webflow.io')) {
      return React.cloneElement(
        <div
          id={p.id}
          className={[p.className, styles.themeOption, p.id === theme_domain ? styles.selected : ''].join(' ')}
          onClick={() => {
            if (p.id) {
              setUpdates({
                ...updates,
                webflow_domain: p.id,
              });

              saveValues({
                progress: 0,
                webflow_domain: p.id,
              } as unknown as EventsData);
            }
          }}
        />,
        {
          children: React.Children.map(p.children.props.children, child => {
            return (
              <Iterator {...child.props} agent={p.agent}>
                {child}
              </Iterator>
            );
          }),
        },
      );
    }

    return (
      <>
        {React.cloneElement(p.children, {
          children: React.Children.map(p.children.props.children, child => {
            return (
              <Iterator {...child.props} agent={p.agent}>
                {child}
              </Iterator>
            );
          }),
        })}
      </>
    );
  } else {
    if (p.children.type === 'img' && p.id && p.id === `${theme_name}-thumbnail` && p.className) {
      return React.cloneElement(
        <img
          {...p}
          className={[
            p.className
              .split(' ')
              .filter(c => c !== 'hidden')
              .join(' '),
            'rexified',
            styles.selectedThumbnail,
          ].join(' ')}
        />,
        {
          children: React.Children.map(p.children.props.children, child => {
            return (
              <Iterator {...child.props} agent={p.agent}>
                {child}
              </Iterator>
            );
          }),
        },
      );
    }
    if (typeof p.children === 'string' && `${p.children}`.indexOf('Your theme:') === 0 && updates) {
      if (updates.webflow_domain) {
        return <>Your theme: {formatAddress(theme_name)}</>;
      }
    }
  }
  if ((p.type === 'text' && p.id) || p.placeholder) {
    let props = p as unknown as { [key: string]: unknown };
    if (props.children) {
      props = {
        ...props,
        children: undefined,
      };
    }
    const field_name = getAgentFieldName(p);
    const field_value = getAgentFieldValue(updates, field_name);
    if (field_name)
      return (
        <RxTextInput {...props} rx-event={Events.UpdateWebsite} name={field_name.split('.').pop() as string} defaultValue={(field_value as string) || ''} />
      );
  }
  return <>{p.children}</>;
}

function getAgentFieldName(props: { id?: string; placeholder?: string }) {
  if (props.id) {
    switch (props.id) {
      case 'Your-domain-URL':
        return 'domain_name';
      case 'head-code':
      case 'head_code':
        return 'agent_metatag.head_code';
      case 'footer-code':
      case 'footer_code':
        return 'agent_metatag.footer_code';
    }
  }
  if (props.placeholder) {
    switch (props.placeholder.toLowerCase()) {
      case 'site title':
        return 'agent_metatag.personal_title';
      case 'description meta tags':
        return 'agent_metatag.description';
    }
  }
}

function getAgentFieldValue(agent: AgentData, field_name?: string) {
  if (agent.metatags && field_name?.indexOf('agent_metatag.') === 0) {
    const [, metatag] = field_name.split('.');
    const metatags = agent.metatags as unknown as { [key: string]: unknown };
    return metatags[metatag];
  }
  if (agent && field_name) {
    const values = agent as unknown as { [key: string]: unknown };
    return values[field_name] || '';
  }
  return '';
}

function UploadsThumbnail(p: any) {
  const { style } = p as {
    style: {
      [key: string]: string;
    };
  };

  return (
    <div {...p} style={style}>
      {p.children}
    </div>
  );
}
