import { AgentData } from '@/_typings/agent';
import { Children, ReactElement, cloneElement } from 'react';
import { getMostRecentWebsiteThemeRequest } from '../api/agents/model';
import RxYourTheme from './website/your-theme.rexifier';
import RxThemeImg from './website/theme-img.rexifier';

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
      if (!props.realtor.website_theme) return <></>;
      return (
        <RxThemeImg
          {...c.props}
          className={
            props.realtor.website_theme
              ? img_attributes.id?.includes(props.realtor.website_theme)
                ? class_list.filter(cn => cn !== 'hidden').join(' ')
                : className
              : className + ' hidden'
          }
        >
          {c}
        </RxThemeImg>
      );
    }
    if (c.type === 'h6') {
      const { children: sub, ...attributes } = c.props;
      return (
        <RxYourTheme {...attributes} theme={props.realtor.website_theme}>
          {sub}
        </RxYourTheme>
      );
    }

    if (c.type === 'a') {
      const { children: sub } = c.props;
      if (sub && typeof sub === 'string' && props.realtor.metatags?.profile_slug) {
        switch (sub.toLowerCase()) {
          case 'preview website':
            return cloneElement(c, {
              href: props.realtor.domain_name
                ? `https://${props.realtor.domain_name}`
                : `https://${props.realtor.website_theme || 'app'}.leagent.com/${props.realtor.agent_id}`,
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
