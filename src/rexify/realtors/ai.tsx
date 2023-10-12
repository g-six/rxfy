'use client';
import React from 'react';
import Cookies from 'js-cookie';
import { useSearchParams, useRouter } from 'next/navigation';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { getUserBySessionKey } from '@/_utilities/api-calls/call-session';
import { searchById, searchByTagName } from '@/_utilities/rx-element-extractor';

import styles from './ai.module.scss';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import useDebounce from '@/hooks/useDebounce';
import { getAgentByParagonId } from '@/_utilities/api-calls/call-realtor';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import Image from 'next/image';
import { createAgentRecord } from '@/_utilities/api-calls/call-realtor';
import RxStreetAddressInput from '@/components/RxForms/RxInputs/RxStreetAddressInput';
import { SearchHighlightInput, SelectedPlaceDetails } from '@/_typings/maps';

type Props = {
  children: React.ReactElement;
  className?: string;
  origin?: string;
};

export default function AiPrompt(p: Props) {
  const { data, fireEvent } = useEvent(Events.LoadUserSession);
  const params = useSearchParams();
  const router = useRouter();
  const [agent_id, setAgentId] = React.useState('');
  const [show_loader, toggleLoader] = React.useState(false);
  const [realtor, setRealtor] = React.useState<{
    agent_id?: string;
    realtor_id?: number;
  }>();
  const [neighbourhoods, selectNeighbourhoods] = React.useState<SearchHighlightInput[]>([]);
  const debounced = useDebounce(agent_id, 500);

  const matches = [
    {
      searchFn: searchById('Enter-Your-Agent-MLS-ID-or-current-Website'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          defaultValue: realtor?.agent_id,
          onChange: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            setAgentId(evt.currentTarget.value);
          },
          onSubmit: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            evt.preventDefault();
          },
        });
      },
    },
    {
      searchFn: searchByTagName('input'),
      transformChild: (child: React.ReactElement) => {
        if (child.props.name === 'target_city') {
          return (
            <RxStreetAddressInput
              {...child.props}
              onSelect={(selected_place: SelectedPlaceDetails) => {
                fireEvent({
                  ...data,
                  target_city: {
                    ...selected_place,
                    name: selected_place.city,
                    lat: selected_place.lat,
                    lng: selected_place.lon,
                    place_id: selected_place.place_id,
                  },
                } as unknown as EventsData);
              }}
            />
          );
        }

        if (child.props.name === 'neighbourhoods') {
          const { city, state_province } = data as unknown as {
            city: string;
            state_province: string;
          };
          const bias = [];
          if (city) bias.push(city);
          if (state_province) bias.push(state_province);
          return (
            <div className='flex flex-col gap-1 w-full'>
              <RxStreetAddressInput
                {...child.props}
                onSelect={({ place_id, short_address, lat, lon, ...geo }) => {
                  selectNeighbourhoods([
                    ...neighbourhoods.filter(s => s.lat !== lat || s.lng !== lon),
                    {
                      ...geo,
                      name: short_address,
                      lat,
                      lng: lon,
                      place_id,
                    },
                  ]);
                }}
                biased_to={bias.join(', ')}
                multiple
              />
              <div className='flex gap-1 w-full'>
                {neighbourhoods.map(n => (
                  <span className='px-1.5 rounded-full bg-slate-700 text-white' key={`${n.lat},${n.lng}`}>
                    {n.name}
                  </span>
                ))}
              </div>
            </div>
          );
        }

        return React.cloneElement(child, {
          onChange: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            if (evt.currentTarget.name) {
              fireEvent({
                ...data,
                [evt.currentTarget.name]: evt.currentTarget.value,
              });
            }
          },
          onSubmit: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            evt.preventDefault();
          },
        });
      },
    },
    {
      searchFn: searchByTagName('form'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(<div />, {
          ...child.props,
          onSubmit: (evt: React.KeyboardEvent<HTMLInputElement>) => {
            evt.preventDefault();
          },
        });
      },
    },
    {
      searchFn: searchById(WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL + '-trigger'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(<button type='button'></button>, {
          ...child.props,
          href: undefined,
          className: `f-button-neutral ${styles.button} ${debounced || agent_id} ` + (show_loader ? styles.loading : ''),
          disabled: !debounced,
          onClick: () => {
            if (debounced) {
              toggleLoader(true);
              getAgentByParagonId(debounced)
                .then(data => {
                  if (data && data.id) {
                    router.push(`${child.props.href}?paragon=${debounced}`);
                  } else {
                    setAgentId(debounced);
                    fireEvent({
                      clicked: WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK,
                      agent_id: debounced,
                    } as unknown as EventsData);
                  }
                })
                .finally(() => toggleLoader(false));
            }
          },
          children: React.Children.map(child.props.children, (gchild: React.ReactElement, idx: number) => {
            if (show_loader) {
              return idx ? (
                <>
                  Building profile <Image src='/loading.gif' alt='Loading' height={24} width={24} />
                </>
              ) : (
                <></>
              );
            } else if (gchild.type === 'div') {
              return <span className={`${gchild.props.className || ''}`}>{gchild.props.children}</span>;
            }
            return gchild;
          }),
        });
      },
    },
    {
      searchFn: searchById(WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK + '-trigger'),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(<button type='button'></button>, {
          ...child.props,
          href: undefined,
          className: `f-button-neutral ${styles.button} ${debounced || agent_id}`,
          disabled: !`${(data as { [key: string]: string }).agent_id}}`,
          onClick: () => {
            const { agent_id, email, full_name, target_city, phone } = data as unknown as {
              agent_id: string;
              email: string;
              full_name: string;
              phone: string;
              target_city: SearchHighlightInput;
            };

            if (agent_id && email && full_name && neighbourhoods && target_city) {
              createAgentRecord({
                agent_id,
                email,
                phone,
                full_name,
                target_city,
                neighbourhoods,
              })
                .then(data => {
                  if (data?.agent_id) location.href = `${origin || ''}/ai-result/${data.agent_id}`;
                })
                .catch(console.error);
            }
          },
          children: React.Children.map(child.props.children, (gchild: React.ReactElement) => {
            if (gchild.type === 'div') {
              return <span className={gchild.props.className || ''}>{gchild.props.children}</span>;
            }
            return gchild;
          }),
        });
      },
    },
  ];

  React.useEffect(() => {
    if (params.get('key')) {
      getUserBySessionKey(Cookies.get('session_key') || (params.get('key') as string), 'realtor').then(agent => {
        const { agent_id, id: realtor_id, session_key } = agent as unknown as { agent_id: string; session_key: string; id: number };
        setRealtor({
          agent_id,
          realtor_id,
        });
        setAgentId(agent_id);
        fireEvent({
          ...data,
          user: agent,
        });
        Cookies.set('session_key', session_key);
      });
    }
  }, []);

  return (
    <div
      className={[
        ...`${p.className}`.split(' '),
        data?.clicked === WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK
          ? p.className === WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK
            ? styles.show
            : styles.hide
          : (p.className === WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK && styles.hide) || styles.show,
        WEBFLOW_NODE_SELECTOR.AI_PROMPT_MODAL_BLANK,
        'rexified w-full',
      ].join(' ')}
    >
      {transformMatchingElements(p.children, matches)}
    </div>
  );
}
