'use client';

import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { NotificationCategory } from '@/_typings/events';
import React, { MouseEventHandler } from 'react';
import Cookies from 'js-cookie';
import { BrokerageData, BrokerageInputModel } from '@/_typings/agent';
import { RxButton } from '@/components/RxButton';
import { RxTextInput } from '@/components/RxTextInput';
import { RxPhoneInput } from '@/components/RxPhoneInput';
import { updateBrokerageInformation } from '@/_utilities/api-calls/call-realtor';
import { BrokerageInput } from '@/_typings/brokerage';
import RxFileUploader from '@/components/RxForms/RxFileUploader';
import { getUploadUrl, invalidateAgentFile } from '@/_utilities/api-calls/call-uploader';
import axios from 'axios';

type Props = {
  type: string;
  children: React.ReactElement;
  className?: string;
  session?: { [key: string]: string | number };
  data: BrokerageData;
};

async function uploadBrokerageLogo(full_file_path: string, file: File) {
  return await getUploadUrl(`${full_file_path}.${file.name.split('.').pop()}`, file);
}

export function RxPageIterator(props: Props & { onSubmit: MouseEventHandler }) {
  const { data: brokerage_data, fireEvent: updateForm } = useEvent(Events.UpdateBrokerage);
  const { data: logo, fireEvent: replaceLogo } = useEvent(Events.UploadBrokerageLogo);
  const defaults = props.session?.brokerage ? (props.session.brokerage as unknown as BrokerageData) : undefined;
  const wrappedChildren = React.Children.map(props.children, child => {
    const child_node = child as React.ReactElement;
    if (child_node.type === 'input') {
      if (child_node.props.className) {
        if (child_node.props.id === 'brokerage-name') {
          return <RxTextInput {...child_node.props} rx-event={Events.UpdateBrokerage} name='name' defaultValue={props.data?.name || defaults?.name || ''} />;
        }
        if (child_node.props.id === 'brokerage-full_address') {
          return (
            <RxTextInput
              {...child_node.props}
              rx-event={Events.UpdateBrokerage}
              name='full_address'
              defaultValue={props.data?.full_address || defaults?.full_address || ''}
            />
          );
        }
        if (child_node.props.id === 'brokerage-phone_number') {
          return (
            <RxPhoneInput
              {...child_node.props}
              rx-event={Events.UpdateBrokerage}
              name='phone_number'
              defaultValue={props.data?.phone_number || defaults?.phone_number || ''}
            />
          );
        }
        if (child_node.props.id === 'brokerage-website_url') {
          return (
            <RxTextInput
              {...child_node.props}
              rx-event={Events.UpdateBrokerage}
              name='website_url'
              defaultValue={props.data?.website_url || defaults?.website_url || ''}
            />
          );
        }
      }

      return <input {...child_node.props} className={[child_node.props.className || '', 'rexified'].join(' ')} />;
    } else if (child.props && child.props.children) {
      if (child.props?.id === 'btn_upload_brokerage_logo') {
        return (
          <RxFileUploader
            className=''
            buttonClassName={`${child.props.className} w-full`}
            data={{
              folder_file_name: `${props.session?.agent_id}/brokerage-logo`,
            }}
            uploadHandler={async (folder_file_name, file) => {
              const { upload_url } = await uploadBrokerageLogo(folder_file_name, file);
              replaceLogo({
                file,
                upload_url,
              } as unknown as EventsData);
              if (upload_url) {
                const logo_url = 'http:/' + new URL(upload_url).pathname;
                updateForm({
                  logo_url,
                } as unknown as EventsData);
              }
            }}
            accept='.jpg,.jpeg,.png'
            event-name={Events.UploadBrokerageLogo}
          >
            {child.props.children}
          </RxFileUploader>
        );
      }
      if (child.props?.id === 'brokerage-logo_url') {
        const { file } = logo as unknown as { file: File };
        let backgroundImage;
        if (file) backgroundImage = `url(${URL.createObjectURL(file)})`;
        else if (defaults?.logo_url) backgroundImage = `url(${defaults?.logo_url})`;
        return React.cloneElement(child, {
          className: child.props.className + (backgroundImage ? ' hide-placeholder' : ''),
          style: {
            backgroundImage,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          },
        });
      }
      if (child.props?.id === 'btn_save_brokerage') {
        return (
          <RxButton
            {...child_node.props}
            rx-event={Events.UpdateBrokerage}
            id={`${Events.UpdateBrokerage}-trigger`}
            disabled={Object.keys(brokerage_data as BrokerageInput).length === 0}
          >
            {child_node.props.children}
          </RxButton>
        );
      }
      return React.cloneElement(
        {
          ...child,
        },
        {
          ...child.props,
          // Wrap grandchildren too
          children: <RxPageIterator {...props}>{child.props.children}</RxPageIterator>,
        },
      );
    } else return child;
  });

  return <>{wrappedChildren}</>;
}

export function BrokerageInformationForm(props: Props) {
  const { data: form_data, fireEvent: updateForm } = useEvent(Events.UpdateBrokerage);
  const { data: logo, fireEvent: replaceLogo } = useEvent(Events.UploadBrokerageLogo);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);
  const [is_processing, processing] = React.useState(false);
  const defaults = props.session?.brokerage ? (props.session.brokerage as unknown as BrokerageData) : undefined;

  const submitForm = () => {
    const updates = {
      ...form_data,
    } as unknown as BrokerageInputModel;
    const { data: valid_data, error } = defaults?.id
      ? {
          error: undefined,
          data: {
            id: defaults.id,
            ...updates,
          },
        }
      : validInput(updates);
    if (error) {
      notify({
        category: NotificationCategory.ERROR,
        message: error,
        timeout: 10000,
      });
      updateForm({
        ...form_data,
        clicked: undefined,
      });
    } else if (valid_data && Cookies.get('session_key')) {
      const { upload_url, file } = logo as {
        upload_url: string;
        file: File;
      };
      if (upload_url && file) {
        axios
          .put(upload_url, file, {
            headers: {
              'Content-Type': file.type,
            },
          })
          .then(upload_xhr => {
            if (upload_xhr.status === 200) {
              const s3_object_path = new URL(upload_url).pathname;
              invalidateAgentFile([s3_object_path.split('/pages.leagent.com').pop() as string]);
            }
          });
      }
      updateBrokerageInformation(valid_data as BrokerageInput)
        .then(record => {
          if (!record.error) {
            updateForm({
              ...record,
              clicked: undefined,
            });
            notify({
              category: NotificationCategory.SUCCESS,
              message: 'Profile updates saved',
              timeout: 5000,
            });
          } else {
            notify({
              category: NotificationCategory.ERROR,
              message: record.error,
              timeout: 10000,
            });
          }
        })
        .catch(e => {
          console.log(e);
          notify({
            category: NotificationCategory.ERROR,
            message: 'Unable to process your request\nPlease try again later',
            timeout: 10000,
          });
        });
    }
  };

  React.useEffect(() => {
    if (is_processing) {
      processing(false);
      submitForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is_processing]);

  React.useEffect(() => {
    let { first_name, last_name } = form_data as unknown as {
      [key: string]: string;
    };

    if (!first_name) first_name = (form_data as unknown as { first_name: string })?.first_name;
    if (!last_name) last_name = (form_data as unknown as { last_name: string })?.last_name;

    const menu_name = [first_name || '', last_name || ''].join(' ').trim();

    document.querySelectorAll('.agent-name').forEach(el => {
      el.textContent = menu_name;
    });
  }, [form_data]);

  React.useEffect(() => {
    if (form_data?.clicked === `${Events.UpdateBrokerage}-trigger`) {
      processing(true);
    }
  }, [form_data]);

  return (
    <div id='rx-my-account-page' className={[props.className || '', is_processing ? 'loading' : ''].join(' ').trim()}>
      <RxPageIterator
        {...props}
        data={form_data as unknown as BrokerageData}
        onSubmit={e => {
          e.preventDefault();
          updateForm({
            ...form_data,
            clicked: `${Events.UpdateBrokerage}-trigger`,
          });
        }}
      />
    </div>
  );
}

function validInput(data: BrokerageInputModel): {
  data?: BrokerageInputModel;
  errors?: {
    [key: string]: string;
  };
  error?: string;
} {
  let error = '';

  // Only select fields that we need to submit to our API
  const { name, phone_number, website_url, full_address, lat, lon, logo_url } = data;
  const required_errors = [];
  if (!name) {
    required_errors.push('name');
  }

  if (!phone_number) {
    required_errors.push('phone number');
  }

  if (!full_address) {
    required_errors.push('address');
  }

  error = required_errors
    .map((field, idx) => {
      if (idx === 0) return `We need the ${field}`;
      else if (idx === required_errors.length - 1) {
        return `and ${field} of your brokerage`;
      } else {
        return field;
      }
    })
    .join(required_errors.length > 2 ? ', ' : ' ');

  if (error) {
    return { error };
  }

  return {
    data: {
      name,
      full_address,
      phone_number,
      website_url,
      lat,
      lon,
      logo_url,
    },
  };
}
