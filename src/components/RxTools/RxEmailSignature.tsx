'use client';
import React from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

import useEvent, { NotificationCategory, Events } from '@/hooks/useEvent';
import RxEmailSignatureContent from '@/components/RxTools/RxEmailSignatureContent';

export default function RxEmailSignature({ nodes, agent }: ReplacerPageProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { fireEvent: notify } = useEvent(Events.SystemNotification);

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['email-signature']),
      transformChild: (child: React.ReactElement) => {
        return (
          <div ref={ref}>
            <RxEmailSignatureContent agent={agent} nodes={[child]} nodeClassName={child.props.className} nodeProps={child.props} />
          </div>
        );
      },
    },
    {
      searchFn: searchByClasses(['order-button']),
      transformChild: (child: React.ReactElement) => {
        return React.cloneElement(child, {
          onClick: onCopy,
        });
      },
    },
  ];

  const onCopy = React.useCallback(() => {
    if (ref?.current) {
      try {
        const range = document.createRange();
        range.selectNode(ref.current);
        window?.getSelection()?.addRange(range);
        document.execCommand('copy');
        notify({
          timeout: 5000,
          category: NotificationCategory.SUCCESS,
          message: 'Your signature is copied!',
        });
        window?.getSelection()?.removeAllRanges();
      } catch (e) {
        notify({
          timeout: 5000,
          category: NotificationCategory.ERROR,
          message: 'Something went wrong!',
        });
      }
    }
  }, [ref, notify]);

  return <>{transformMatchingElements(nodes, matches)}</>;
}
