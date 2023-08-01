'use client';
import { Children, ReactElement, cloneElement } from 'react';

import { AgentData } from '@/_typings/agent';
import { getAgentPhoto } from '@/_utilities/data-helpers/agent-helper';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';

type Props = {
  child: ReactElement;
  agent: AgentData;
};

function Iterator({ agent, children }: { agent: AgentData; children: ReactElement }) {
  const Wrapped = Children.map(children, c => {
    if (c.type === 'div') {
      const { children: subchildren, ...props } = c.props;
      if (typeof subchildren !== 'string')
        return (
          <div {...props}>
            <Iterator agent={agent}>{subchildren}</Iterator>
          </div>
        );
    }
    if (c.type === 'img') {
      const photo = agent ? getAgentPhoto(agent) : '';
      if (photo) {
        return cloneElement(<div />, {
          ...c.props,
          src: undefined,
          style: {
            backgroundImage: `url(${getImageSized(photo, 50)})`,
            backgroundPosition: 'center center',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            height: '100%',
            width: '100%',
          },
        });
      }
    }
    if (typeof c.props?.children === 'string') {
      const p = agent as unknown as {
        [k: string]: string;
      };
      p.phone_number = agent.phone;
      const props = c.props;
      if (props.href && props['data-field'] && p[props['data-field']]) {
        switch (props['data-field']) {
          case 'phone_number':
            props.href = `tel:${p[props['data-field']]}`;
            break;

          case 'email':
            props.href = `mailto:${p[props['data-field']]}`;
            break;
        }
      }
      return cloneElement(
        c,
        props,
        c.props['data-field'] && p[c.props['data-field']] ? p[c.props['data-field']] : c.props.children.split('{Agent Name}').join(agent.full_name),
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default function RxPropertyAgent(props: Props) {
  return <Iterator agent={props.agent}>{props.child}</Iterator>;
}
