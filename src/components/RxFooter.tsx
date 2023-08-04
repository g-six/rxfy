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
    if (c.props?.['data-field']) {
      const { ['data-field']: field } = props;
      switch (field) {
        case 'logo':
          const logo = agent.metatags.logo_for_light_bg || agent.metatags.logo_for_dark_bg;
          if (logo)
            return cloneElement(c, {
              ...props,
              className: classNames(props.className || '', styles.logo),
              style: {
                backgroundImage: `url(${getImageSized(logo, 200)}?v=${agent.last_activity_at})`,
              },
            });
      }
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
