import { AgentData } from '@/_typings/agent';
import { Children, ReactElement, cloneElement } from 'react';
import { getMostRecentWebsiteThemeRequest } from '../api/agents/model';

interface RexifyComponent {
  children: ReactElement;
  realtor: AgentData;
  'data-id'?: number;
}

function Rx({ children, ...props }: RexifyComponent) {
  const Wrapped = Children.map(children, c => {
    if (c.type === 'div') {
      const { children: sub, ...div_attributes } = c.props;
      if (!props['data-id']) {
        // Website is already processed
        if (div_attributes.className?.includes('status-field') || div_attributes.className?.includes('website-theme-status')) {
          return <></>;
        }
      }
      return (
        <div {...div_attributes}>
          <Rx {...props}>{sub}</Rx>
        </div>
      );
    }
    if (c.type === 'img' && c.props?.className?.includes('selected-theme-image')) {
      const { className, ...img_attributes } = c.props;
      const class_list = `${className || ''}`.split(' ');
      return img_attributes.id?.includes(props.realtor.website_theme)
        ? cloneElement(c, {
            className: class_list.filter(cn => cn !== 'hidden').join(' '),
          })
        : c;
    }
    if (c.type === 'a') {
      const { children: sub } = c.props;
      if (sub && typeof sub === 'string' && props.realtor.metatags?.profile_slug) {
        switch (sub.toLowerCase()) {
          case 'preview website':
            return cloneElement(c, {
              href: `/${props.realtor.agent_id}/${props.realtor.metatags.profile_slug}`,
              target: '_blank',
            });
        }
      }
    }
    return c;
  });
  return <>{Wrapped}</>;
}

export default async function MyWebSiteSelectedTheme({ children, ...props }: RexifyComponent) {
  const { agent } = props.realtor as unknown as {
    agent: number;
  };
  const theme_request = await getMostRecentWebsiteThemeRequest(agent);
  return (
    <Rx {...props} data-id={theme_request?.id}>
      {children}
    </Rx>
  );
}
