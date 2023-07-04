import React, { cloneElement, createElement, ReactElement, useEffect, useState } from 'react';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import Input from '../FilterFields/Input';
import RxDropzone from '@/components/RxDropzone';
import { ImagePreview } from '@/hooks/useFormEvent';
import { createSmartCard, deleteSmartCard } from '@/_utilities/api-calls/call-smart-cards';
import { SmartCardInput, SmartCardResponse } from '@/_typings/smart-cards';
import { AgentData } from '@/_typings/agent';
import QR from 'qrcode';
type Props = {
  template: ReactElement;
  showDetails: boolean;
  details: SmartCardResponse | undefined;
  updateCardsList: (actionName: string, data: any) => void;
  agent: AgentData;
};
interface SmartCardForm extends SmartCardResponse {
  logo?: ImagePreview;
}
export default function EditNewCardForm({ template, showDetails, details, updateCardsList, agent }: Props) {
  const opacityDelay = 300; // milliseconds (1 second)
  const widthDelay = 300; // milliseconds (0.5 seconds)
  const [qr, setQR] = useState<string | undefined>();
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
  const [form, setForm] = useState<SmartCardForm | undefined>(details);

  useEffect(() => {
    setForm(details);
  }, [details]);
  const logoPreview = (form?.logo ? form?.logo?.preview : form?.logo_url) ?? null;
  useEffect(() => {
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
      console.log(agent);
      getQRCode();
    }
  }, [agent]);
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['edit-new-card']),
      transformChild: child => {
        return cloneElement(child, {
          style: animationStyles,
          className: `${child.props.className}  `,
        });
      },
    },
    {
      searchFn: searchByClasses(['leagent-card-title']),
      transformChild: child => cloneElement(child, {}, details?.id ? [`Leagent Card ${details.id}`] : child.props.children),
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
        cloneElement(child, {}, logoPreview ? [<img key={0} src={logoPreview} alt='Smart Card Agent Front Logo' />] : child.props.children),
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
      searchFn: searchByClasses(['smart-card-logo-front']),
      transformChild: child => cloneElement(child, {}, logoPreview ? [<img key={0} src={logoPreview} alt='Smart Card Agent Front Logo' />] : []),
    },
    { searchFn: searchByClasses(['text-3']), transformChild: child => cloneElement(child, {}, form?.name ? [form.name] : []) },
    { searchFn: searchByClasses(['text-4']), transformChild: child => cloneElement(child, {}, form?.title ? [form.title] : []) },
    { searchFn: searchByClasses(['smart-card-agent-phone']), transformChild: child => cloneElement(child, {}, agent?.phone ?? '') },
    { searchFn: searchByClasses(['smart-card-agent-qr']), transformChild: child => (qr ? cloneElement(child, { src: qr }) : <></>) },
    {
      searchFn: searchByClasses(['smart-card-logo-back']),
      transformChild: child => cloneElement(child, {}, logoPreview ? [<img key={0} src={logoPreview} alt='Smart Card Agent Back Logo' />] : []),
    },
    {
      searchFn: searchByClasses(['delete-card']),
      transformChild: child =>
        details?.id ? (
          createElement(
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
          createElement(
            'button',
            {
              className: child.props.className,
              onClick: (e: any) => {
                e.preventDefault();
                createSmartCard(form as SmartCardInput).then(res => {
                  updateCardsList('new', {
                    id: Number(res.record.id),
                    name: res.record.attributes.name,
                    title: res.record.attributes.title,
                    logo_url: res.record.attributes.logo_url,
                  } as SmartCardResponse);
                });
              },
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
