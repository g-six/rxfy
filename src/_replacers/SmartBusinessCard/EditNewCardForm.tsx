import QR from 'qrcode';
import html2canvas from 'html2canvas';
import React, { ReactElement } from 'react';
import MailChimp from '@mailchimp/mailchimp_transactional';

import { AgentData } from '@/_typings/agent';
import { ImagePreview } from '@/hooks/useFormEvent';
import { SmartCardInput, SmartCardResponse } from '@/_typings/smart-cards';
import { createSmartCard, deleteSmartCard, emailSmartCard } from '@/_utilities/api-calls/call-smart-cards';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';

import Input from '../FilterFields/Input';
import RxDropzone from '@/components/RxDropzone';
import EditNewCardFormFront from '@/_replacers/SmartBusinessCard/EditNewCardFromFront';
import EditNewCardFormBack from '@/_replacers/SmartBusinessCard/EditNewCardFromBack';
import { invertImage } from '@/_helpers/image-manipulations';

type Props = {
  template: ReactElement;
  showDetails: boolean;
  details: SmartCardResponse | undefined;
  updateCardsList: (actionName: string, data: any) => void;
  agent: AgentData;
};
export interface SmartCardForm extends SmartCardResponse {
  logo?: ImagePreview;
}

export default function EditNewCardForm({ template, showDetails, details, updateCardsList, agent }: Props) {
  const opacityDelay = 300; // milliseconds (1 second)
  const widthDelay = 300; // milliseconds (0.5 seconds)

  const animationStyles = showDetails
    ? {
        width: '100%',
        opacity: 1,
        transition: `width ${widthDelay}ms ease, opacity ${opacityDelay}ms ease ${opacityDelay}ms`,
      }
    : {
        width: 0,
        opacity: 0,
        transition: `width ${widthDelay}ms ease ${widthDelay}ms, opacity ${opacityDelay}ms ease`,
      };

  const [qr, setQR] = React.useState<string | undefined>();
  const [form, setForm] = React.useState<SmartCardForm | undefined>(details);

  const refFront = React.useRef<HTMLDivElement>(null);
  const refBack = React.useRef<HTMLDivElement>(null);

  const logoPreview = (form?.logo ? form?.logo?.preview : form?.logo_url) ?? null;
  React.useEffect(() => setForm(details), [details]);

  React.useEffect(() => {
    async function getQRCode() {
      let qr_url = '';
      if (agent.domain_name) {
        qr_url = `https://${agent.domain_name}/id`;
      } else if (agent.agent_id && agent.agent_metatag.profile_slug) {
        qr_url = `https://leagent.com/${agent.agent_id}/${agent.agent_metatag.profile_slug}/id`;
      }

      if (qr_url) {
        const qr = await QR.toDataURL(qr_url, {
          color: {
            light: '#fff', // Transparent background
          },
        });
        setQR(qr);
      }
    }
    if (agent) {
      getQRCode();
    }
  }, [agent]);

  const onSave = React.useCallback(
    (e: any) => {
      e.preventDefault();
      createSmartCard(form as SmartCardInput).then(res => {
        if (refFront?.current && refBack?.current) {
          const promises = Array.from([refFront.current, refBack.current])
            .map(el => el as HTMLElement)
            .map(el => {
              el.style.backgroundColor = 'transparent';
              el.style.borderRadius = '0';
              return html2canvas(el, { allowTaint: true, useCORS: true });
            });
          console.log('promises');
          console.log(promises);
          Promise.all(promises).then(canvases => {
            const anotherPromises = canvases.map(canvas => {
              return new Promise(resolve => {
                canvas.getContext('2d');
                const canvasImage = canvas.toDataURL('image/png');
                invertImage(canvasImage, base64 => resolve(base64));
              });
            });
            Promise.all(anotherPromises)
              .then(files => {
                const attachments = files.map((base64, i) => {
                  return { type: 'image/png', name: `card_image_${i + 1}.png`, content: base64 };
                });
                return emailSmartCard(Number(res.record.id), attachments as unknown[], {
                  name: form?.name as string,
                  email: agent && agent.email,
                  phone: agent?.phone as string,
                });
                // const send_to: MailChimp.MessageRecipient[] = [{ email: 'team@leagent.com', name: 'Leaget Team' }];
                // sendTemplate(
                //   'new-card-order',
                //   send_to,
                //   {
                //     name: form?.name as string,
                //     customer_email: agent && agent.email,
                //     customer_name: form?.name as string,
                //     customer_phone: agent?.phone as string,
                //   },
                //   attachments,
                // ).then(() => {
                //   updateCardsList('new', {
                //     id: Number(res.record.id),
                //     name: res.record.attributes.name,
                //     title: res.record.attributes.title,
                //     logo_url: res.record.attributes.logo_url,
                //   } as SmartCardResponse);
                // });
              })
              .then(() => {
                updateCardsList('new', {
                  id: Number(res.record.id),
                  name: res.record.attributes.name,
                  title: res.record.attributes.title,
                  logo_url: res.record.attributes.logo_url,
                } as SmartCardResponse);
              });
          });
        }
      });
    },
    [form, agent, updateCardsList],
  );

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['edit-new-card']),
      transformChild: child => {
        return React.cloneElement(child, {
          style: animationStyles,
          className: `${child.props.className}  `,
        });
      },
    },
    {
      searchFn: searchByClasses(['leagent-card-title']),
      transformChild: child => React.cloneElement(child, {}, details?.id ? [`Leagent Card ${details.id}`] : child.props.children),
    },
    {
      searchFn: searchByClasses(['input-agent-name']),
      transformChild: child => (
        <Input
          template={child}
          inputProps={{ disabled: Boolean(details?.id), placeholder: 'Your name' }}
          value={form?.name ?? ''}
          onChange={e => {
            setForm((prev: any) => ({ ...prev, name: e.target.value }));
          }}
        />
      ),
    },
    {
      searchFn: searchByClasses(['input-agent-title']),
      transformChild: child => (
        <Input
          template={child}
          inputProps={{ disabled: Boolean(details?.id), placeholder: 'Your title' }}
          value={form?.title ?? ''}
          onChange={e => {
            setForm((prev: any) => ({ ...prev, title: e.target.value }));
          }}
        />
      ),
    },
    {
      searchFn: searchByClasses(['thumbnail-wrapper']),
      transformChild: child =>
        React.cloneElement(
          child,
          {},
          logoPreview ? [<img key={0} src={logoPreview} alt='Smart Card Agent Front Logo' className='w-full h-full object-contain' />] : child.props.children,
        ),
    },
    {
      searchFn: searchByClasses(['upload-button']),
      transformChild: child =>
        details?.id ? (
          <></>
        ) : (
          <RxDropzone
            className={'upload-button'}
            onFileUpload={(newFiles: ImagePreview[]) => {
              setForm((prev: any) => ({ ...prev, logo: newFiles[0] }));
            }}
            inputId='agent_logo'
          >
            {child.props.children}
          </RxDropzone>
        ),
    },
    {
      searchFn: searchByClasses(['card-front']),
      transformChild: (child: ReactElement) => {
        return (
          <div ref={refFront}>
            <EditNewCardFormFront form={form} nodes={[child]} logoPreview={logoPreview} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['card-back']),
      transformChild: (child: ReactElement) => {
        return (
          <div ref={refBack}>
            <EditNewCardFormBack agent={agent} qr={qr} nodes={[child]} logoPreview={logoPreview} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['delete-card']),
      transformChild: child =>
        details?.id ? (
          React.createElement(
            'button',
            {
              className: child.props.className,
              onClick: (e: React.SyntheticEvent<HTMLButtonElement>) => {
                e.preventDefault();
                deleteSmartCard(details.id).then(res => {
                  res?.record && updateCardsList('delete', res.record);
                });
              },
            },
            child.props.children,
          )
        ) : (
          <></>
        ),
    },
    {
      searchFn: searchByClasses(['save-smart-card']),
      transformChild: child =>
        !details?.id ? (
          React.createElement(
            'button',
            {
              className: child.props.className,
              onClick: onSave,
            },
            child.props.children,
          )
        ) : (
          <></>
        ),
    },
  ];
  return <>{transformMatchingElements(template, matches)}</>;
}
