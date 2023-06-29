import axios from 'axios';
import React, { ReactElement, cloneElement, createElement } from 'react';

import { TabContentProps } from '@/_typings/agent-my-listings';
import { searchByClasses, searchByPartOfClass, searchByProp } from '@/_utilities/rx-element-extractor';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { AgentMetatags } from '@/_typings/agent';
import { domToReact, htmlToDOM } from 'html-react-parser';
import Image from 'next/image';

export default function TabPreview({ template, data, fireEvent, agent, nextStepClick }: TabContentProps) {
  const [lid, setLid] = React.useState<number | undefined>(data?.id);
  const [image, setImage] = React.useState<React.ReactElement>();
  const [newDescr, setNewDescr] = React.useState<string>(data?.description);
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['publish']),
      transformChild: child => {
        const isActive = data?.status?.toLowerCase() === 'active';
        return createElement(
          'button',
          {
            className: child.props.className,
            onClick: () => {
              fireEvent({ status: isActive ? 'draft' : 'active' });

              nextStepClick(
                () => {
                  setImage(undefined);
                  loadPreview();
                },
                { status: isActive ? 'draft' : 'active' },
              );
            },
          },
          [isActive ? 'Set as Draft' : 'Publish'],
        );
      },
    },
    {
      searchFn: searchByClasses(['badge-small-dot']),
      transformChild: child => {
        const cloned = cloneElement(
          child,
          {},
          transformMatchingElements(<>{child.props.children}</>, [
            { searchFn: searchByPartOfClass(['text-block']), transformChild: child => cloneElement(child, {}, [data?.status ?? 'Unpublished']) },
          ]) as ReactElement[],
        );

        return cloned;
      },
    },
    {
      searchFn: searchByPartOfClass(['pl-preview-wrapper']),
      transformChild: child => cloneElement(child, {}),
    },
    {
      searchFn: searchByPartOfClass(['description-input']),
      transformChild: child =>
        cloneElement(child, {
          value: newDescr,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setNewDescr(e.currentTarget.value);
          },
        }),
    },
    {
      searchFn: searchByPartOfClass(['reset']),
      transformChild: child =>
        cloneElement(child, {
          onClick: (e: React.SyntheticEvent<HTMLButtonElement>) => {
            e.preventDefault();
            setNewDescr(data?.description ?? '');
          },
        }),
    },
    {
      searchFn: searchByPartOfClass(['save']),
      transformChild: child =>
        cloneElement(child, {
          onClick: (e: React.SyntheticEvent<HTMLButtonElement>) => {
            e.preventDefault();
            fireEvent({ description: newDescr });
            nextStepClick(
              () => {
                setImage(undefined);
                loadPreview();
              },
              { description: newDescr },
            );
          },
        }),
    },
  ];

  const loadPreview = () => {
    if (location && !image) {
      const { origin } = new URL(location.href || '');
      if (!agent.metatags) {
        const { agent_metatag } = agent as unknown as {
          agent_metatag: AgentMetatags;
        };
        agent.metatags = agent_metatag;
      }
      if (origin && agent.metatags && data?.id) {
        setImage(<Image src='/loading.gif' width='32' height='32' className='m-8' alt='property preview page is loading' />);
        axios
          .get([origin, 'api/private-listings', data.id, 'screengrab'].join('/') + `?agent=${agent.agent_id}&slug=${agent.metatags.profile_slug}`)
          .then(r => {
            if (r.data) {
              setLid(undefined);
              setImage(domToReact(htmlToDOM(r.data)) as React.ReactElement);
            }
          });
      }
    }
  };

  React.useEffect(loadPreview, [data, agent, image]);

  React.useEffect(() => {
    setImage(undefined);
    loadPreview();
  }, []);

  return data?.id ? (
    <div className='flex flex-col h-full'>
      {transformMatchingElements(template, matches)}{' '}
      <div className='rounded-xl overflow-hidden m-4 shadow items-center flex justify-center'>
        {image || <Image src='/loading.gif' width='32' height='32' className='m-8' alt='property preview page is loading' />}
      </div>
    </div>
  ) : (
    <></>
  );
}
