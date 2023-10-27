import { AgentData } from '@/_typings/agent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';
import { Children, ReactElement, cloneElement } from 'react';
import styles from './RxFooter.module.scss';
import { getAgentBaseUrl } from '@/app/api/_helpers/agent-helper';

function Iterator({ children, ...data }: { agent: AgentData; children: ReactElement }) {
  const Wrapped = Children.map(children, c => {
    const { children: sub, ...props } = c.props || {};
    if (sub && typeof sub !== 'string') {
      return cloneElement(c, {}, <Iterator {...data}>{sub}</Iterator>);
    }
    if (c.props?.['data-field']) {
      const { ['data-field']: field } = props;
      const { metatags } = data.agent as unknown as {
        metatags: {
          [k: string]: string;
        };
      };
      switch (field) {
        case 'phone':
          return cloneElement(
            c,
            {
              href: `tel:${data.agent.phone}`,
            },
            data.agent.phone,
          );
        case 'email':
          return cloneElement(
            c,
            {
              href: `mailto:${data.agent.email}`,
            },
            data.agent.email,
          );
        case 'facebook_url':
        case 'twitter_url':
        case 'instagram_url':
        case 'linkedin_url':
        case 'youtube_url':
          if (!metatags[c.props['data-field']]) return <></>;
          return cloneElement(c, {
            className: classNames(c.props.className || '', 'homepage-rexified').trim(),
            rel: 'nofollow',
            href: 'https://' + `${metatags[c.props['data-field']] || `#no-${c.props['data-field']}`}`.split('://').pop(),
          });
        case 'logo':
        case 'logo_for_light_bg':
        case 'logo_for_dark_bg':
          const logo = data.agent.metatags.logo_for_light_bg || data.agent.metatags.logo_for_dark_bg;
          console.log(c.type, field, logo, data.agent.metatags);
          if (logo) {
            if (c.type === 'img') {
              return cloneElement(c, {
                src: `${getImageSized(logo, 200)}?v=${data.agent.metatags.last_updated_at})`,
              });
            }
            return cloneElement(c, {
              ...props,
              className: classNames(props.className || '', styles.logo),
              style: {
                backgroundImage: `url(${getImageSized(logo, 200)}?v=${data.agent.metatags.last_updated_at})`,
              },
            });
          } else if (c.type === 'img') return data.agent.full_name;
          return cloneElement(c, {}, data.agent.full_name);
      }
    }
    if (c.props?.href && c.props?.href.indexOf('://') === -1) {
      return cloneElement(
        c,
        {
          ...props,
          href: `${getAgentBaseUrl(data.agent)}${props.href}`,
        },
        <Iterator {...data}>{sub}</Iterator>,
      );
    }

    return c;
  });
  return <>{Wrapped}</>;
}

export default function FooterIterator({ agent, children }: { agent: AgentData; children: ReactElement }) {
  return <Iterator agent={agent}>{children}</Iterator>;
}
