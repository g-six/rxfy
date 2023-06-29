import React, { cloneElement, ReactElement } from 'react';

import { ReplacerPageProps } from '@/_typings/forms';
import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

import RxSmartBusinessCard from '@/components/RxTools/RxSmartBusinessCard';
import RxEmailSignature from '@/components/RxTools/RxEmailSignature';
import RxFacebookCover from '@/components/RxTools/RxFacebookCover';
import RxPaperBusinessCard from '@/components/RxTools/RxPaperBusinessCard';
import RxPropertyBrochures from '@/components/RxTools/RxPropertyBrochures';

export default function RxTools({ nodeProps, agent, nodes, nodeClassName }: ReplacerPageProps) {
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['smart-business-card-tab']),
      transformChild: (child: ReactElement) => {
        const el = [cloneElement(child.props.children) as ReactElement];
        return (
          <RxSmartBusinessCard nodeClassName={child.props.className} nodeProps={child.props} agent={agent}>
            {el}
          </RxSmartBusinessCard>
        );
      },
    },
    {
      searchFn: searchByClasses(['email-signature-tab']),
      transformChild: (child: ReactElement) => {
        const el = [cloneElement(child.props.children) as ReactElement];
        return (
          <RxEmailSignature nodeClassName={child.props.className} nodeProps={child.props} agent={agent}>
            {el}
          </RxEmailSignature>
        );
      },
    },
    {
      searchFn: searchByClasses(['facebook-cover-tab']),
      transformChild: (child: ReactElement) => {
        const el = [cloneElement(child.props.children) as ReactElement];
        return (
          <RxFacebookCover nodeClassName={child.props.className} nodeProps={child.props} agent={agent}>
            {el}
          </RxFacebookCover>
        );
      },
    },
    {
      searchFn: searchByClasses(['paper-business-card-tab']),
      transformChild: (child: ReactElement) => {
        const el = [cloneElement(child.props.children) as ReactElement];
        return (
          <RxPaperBusinessCard nodeClassName={child.props.className} nodeProps={child.props} agent={agent}>
            {el}
          </RxPaperBusinessCard>
        );
      },
    },
    {
      searchFn: searchByClasses(['property-brochure-tab']),
      transformChild: (child: ReactElement) => {
        const el = [cloneElement(child.props.children) as ReactElement];
        return (
          <RxPropertyBrochures nodeClassName={child.props.className} nodeProps={child.props} agent={agent}>
            {el}
          </RxPropertyBrochures>
        );
      },
    },
  ];

  return <>{agent ? transformMatchingElements(nodes, matches) : nodes}</>;
}
