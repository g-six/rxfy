import { AgentData } from '@/_typings/agent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { classNames } from '@/_utilities/html-helper';
import { Children, ReactElement, cloneElement } from 'react';
import styles from './RxFooter.module.scss';

function LinkIterator({ agent, children, ...p }: { agent: AgentData; children: ReactElement }) {
  const Wrapped = Children.map(children, c => {
    const { children: sub, href, ...props } = c.props || {};
    if (props && props['data-field']) {
      switch (props['data-field']) {
        case 'logo':
          const logo = agent.metatags?.logo_for_light_bg || agent.metatags?.logo_for_dark_bg;
          return cloneElement(c, {
            ...props,
            className: logo ? classNames(props.className, styles.logo, 'bg-no-repeat bg-left-center') : props.className,
            style: logo
              ? {
                  backgroundImage: `url(${getImageSized(logo, 120)})`,
                  textIndent: '-99999px',
                }
              : {},
          });
        case 'phone':
          return cloneElement(
            c,
            {
              ...props,
              href: `tel:${agent.phone}`,
            },
            agent.phone,
          );
      }
    }
    if (c.type === 'div') {
      return (
        <span {...props} className={classNames(props.className || '', 'rexified')}>
          <LinkIterator agent={agent}>{sub}</LinkIterator>
        </span>
      );
    }

    return c;
  });

  return <a {...p}>{Wrapped}</a>;
}

function Iterator({ agent, children }: { agent: AgentData; children: ReactElement }) {
  const Wrapped = Children.map(children, c => {
    const { children: sub, ...props } = c.props || {};
    // if (c.type === 'a') {
    //   return (
    //     <LinkIterator {...props} agent={agent}>
    //       {sub}
    //     </LinkIterator>
    //   );
    // }
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
                backgroundImage: `url(${getImageSized(logo, 200)})`,
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
