'use client';
import React from 'react';

import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import useEvent, { Events } from '@/hooks/useEvent';
import useLove from '@/hooks/useLove';
import { loveHome } from '@/_utilities/api-calls/call-love-home';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';

type PropertyActionsProps = {
  child: React.ReactElement;
  property: PropertyDataModel | undefined;
  agent: AgentData;
};

export default function RxPropertyActions(props: PropertyActionsProps) {
  const eventFormShow = useEvent(Events.ContactFormShow);
  const { data } = useLove();
  const loved_homes: string[] = getData(Events.LovedItem) || [];
  const [origin, setOrigin] = React.useState('');
  const [loved, setLoved] = React.useState(false);
  React.useEffect(() => {
    if (data === undefined || data.items?.length === 0) {
      if (props?.property && loved_homes.length && loved_homes.includes(props.property.mls_id)) {
        setLoved(true);
      }
    }
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
    setOrigin(origin);
  }, []);

  const propertyLink = props?.property ? `${origin}/property?mls=${props.property.mls_id}` : '#';
  const replaceLove = (child: React.ReactElement) =>
    React.cloneElement(<button />, {
      ...child.props,
      href: undefined,
      className: `rexified ${child.props.className} pt-[0.5rem]`,
      children: (
        <span className={`${loved ? 'text-red-500' : 'text-white stroke-slate-700 stroke-2'}`}>
          <svg className={loved ? 'w-5 h-5' : 'w-5 h-5'} viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M16.5 3C19.538 3 22 5.5 22 9C22 16 14.5 20 12 21.5C9.5 20 2 16 2 9C2 5.5 4.5 3 7.5 3C9.36 3 11 4 12 5C13 4 14.64 3 16.5 3Z'
              fill='currentColor'
            ></path>
          </svg>
        </span>
      ),
      ['data-mls_id']: props?.property?.mls_id || '',
      onClick: () => {
        if (!loved) {
          const item = props.property ? props.property : { mls_id: '' };
          loveHome(item.mls_id, props.agent.id);
        }
        setLoved(!loved);
      },
    });

  const matches = [
    {
      searchFn: searchByClasses(['copy-link-to-property']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          onClick: () => navigator.clipboard.writeText(propertyLink),
        }),
    },
    {
      searchFn: searchByClasses(['share-on-facebook']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          href: `https://www.facebook.com/sharer/sharer.php?u=${propertyLink}`,
          target: '_blank',
          onClick: () => 'javascript:window.open(this.href,"", "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600");return false;',
          rel: 'noopener noreferrer',
        }),
    },
    {
      searchFn: searchByClasses(['share-via-email']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          target: '_blank',
          onClick: () => 'javascript:window.open(this.href,"", "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600");return false;',
          rel: 'noopener noreferrer',
        }),
    },
    {
      searchFn: searchByClasses(['p-action-pdf']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(<button />, {
          ...child.props,
          onClick: () =>
            window.open(
              `/api/pdf/mls/${props.property && props.property.mls_id}?agent=${props.agent.agent_id}&slug=${props.agent.metatags.profile_slug}/brochure?mls=${
                props.property && props.property.mls_id
              }`,
            ),
        }),
    },
    {
      searchFn: searchByClasses(['p-action-compare']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          href: '/compare', //temporally, until compare-page is not finished and merged into main
        }),
    },
    {
      searchFn: searchByClasses(['p-action-ask']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          onClick: () => eventFormShow.fireEvent({ show: true }),
        }),
    },
    {
      searchFn: searchByClasses(['p-action-heart']),
      transformChild: replaceLove,
    },
    {
      searchFn: searchByClasses(['action-heart']),
      transformChild: replaceLove,
    },
  ];

  return <>{transformMatchingElements(props.child, matches)}</>;
}
