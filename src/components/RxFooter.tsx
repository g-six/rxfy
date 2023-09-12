import { AgentData } from '@/_typings/agent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';
import { Children, ReactElement, cloneElement } from 'react';
import styles from './RxFooter.module.scss';

function Iterator({ agent, children }: { agent: AgentData; children: ReactElement }) {
  const Wrapped = Children.map(children, c => {
    const { children: sub, ...props } = c.props || {};
    if (c.type === 'div') {
      return (
        <div {...props}>
          <Iterator agent={agent}>{sub}</Iterator>
        </div>
      );
    }
    if (c.props?.['data-field']) {
      const { ['data-field']: field } = props;
      const { metatags } = agent as unknown as {
        metatags: {
          [k: string]: string;
        };
      };
      switch (field) {
        case 'phone':
          return cloneElement(
            c,
            {
              href: `tel:${agent.phone}`,
            },
            agent.phone,
          );
        case 'email':
          return cloneElement(
            c,
            {
              href: `mailto:${agent.email}`,
            },
            agent.email,
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
          const logo = agent.metatags.logo_for_light_bg || agent.metatags.logo_for_dark_bg;
          console.log('logo', agent.metatags);
          if (logo)
            return cloneElement(c, {
              ...props,
              className: classNames(props.className || '', styles.logo),
              style: {
                backgroundImage: `url(${getImageSized(logo, 200)}?v=${agent.metatags.last_updated_at})`,
              },
            });
          else {
            return cloneElement(c, {}, agent.full_name);
          }
      }
    }
    if (c.props?.href) {
      return cloneElement(
        c,
        {
          ...props,
          href: `/${agent.agent_id}/${agent.metatags.profile_slug}${props.href}`,
        },
        <Iterator agent={agent}>{sub}</Iterator>,
      );
    }

    return c;
  });
  return <>{Wrapped}</>;
}

export default function FooterIterator({ agent, children }: { agent: AgentData; children: ReactElement }) {
  return (
    <footer className='f-footer-small'>
      <Iterator agent={agent}>{children}</Iterator>
    </footer>
  );
}
