import React, { cloneElement } from 'react';

import { tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses, searchByPartOfClass } from '@/_utilities/rx-element-extractor';
import { SmartCardForm } from '@/_replacers/SmartBusinessCard/EditNewCardForm';
import { AgentData } from '@/_typings/agent';

type Props = {
  logoPreview: string | undefined | null;
  form: SmartCardForm | undefined;
  nodes: React.ReactElement[];
};

export default function EditNewCardFormFront({ nodes, form, logoPreview }: Props) {
  const matches: tMatch[] = [
    {
      searchFn: searchByPartOfClass(['vectors-wrapper']),
      transformChild: child =>
        cloneElement(child, {
          src: logoPreview || child.props.src,
        }),
    },
    {
      searchFn: searchByClasses(['text-3']),
      transformChild: child => cloneElement(child, {}, form?.name ? [form.name] : []),
    },
    {
      searchFn: searchByClasses(['text-4']),
      transformChild: child => cloneElement(child, {}, form?.title ? [form.title] : []),
    },
  ];
  return <>{transformMatchingElements(nodes, matches)}</>;
}
