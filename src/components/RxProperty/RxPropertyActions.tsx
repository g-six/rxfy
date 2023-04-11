'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

import { MLSProperty } from '@/_typings/property';
import { searchByClasses } from '@/_utilities/searchFnUtils';
import { transformMatchingElements } from '@/_helpers/findElements';

type PropertyActionsProps = {
  child: React.ReactElement;
  property: MLSProperty;
};

export default function RxPropertyActions(props: PropertyActionsProps) {
  const router = useRouter();
  const [origin, setOrigin] = React.useState('');

  React.useEffect(() => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
    setOrigin(origin);
  }, []);

  const propertyLink = `${origin}/property?mls=${props.property.MLS_ID}`;
  console.log('propertyLink', propertyLink);

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
          href: `mailto:?subject=Very lovely property on Leagent&body=Very lovely property at ${props.property.Address} on Leagent ${
            typeof window !== 'undefined' ? window.location.href : ''
          }`,
          target: '_blank',
          onClick: () => 'javascript:window.open(this.href,"", "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600");return false;',
          rel: 'noopener noreferrer',
        }),
    },
    {
      searchFn: searchByClasses(['p-action-pdf']),
      transformChild: (child: React.ReactElement) =>
        React.cloneElement(child, {
          ...child.props,
          href: `https://app.leagent.com/property/${props.property.MLS_ID}/pdf`,
          target: '_blank',
          rel: 'noopener noreferrer',
        }),
    },
  ];

  return <>{transformMatchingElements(props.child, matches)}</>;
}
