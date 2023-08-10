import { AgentData } from '@/_typings/agent';
import { Children, ReactElement, cloneElement } from 'react';

function Iterator({ theme, children }: { theme: string; children: ReactElement }) {
  const Wrapped = Children.map(children, c => {
    if (c.type === 'div') {
      const { children: sub, ...props } = c.props;
      return (
        <div {...props}>
          <Iterator theme={theme}>{sub}</Iterator>
        </div>
      );
    }
    if (c.type === 'img' && c.props.id === `${theme}-thumbnail`) {
      const { className, ...props } = c.props;
      return cloneElement(c, {
        ...props,
        className: className.split('hidden').join(''),
      });
    }
    return c;
  });
  return <>{Wrapped}</>;
}
export default function RxSelectedTheme({ agent, children }: { agent: AgentData; children: ReactElement }) {
  const { website_theme, metatags } = agent;
  return (
    <section>
      <Iterator theme={website_theme}>{children}</Iterator>
    </section>
  );
}
