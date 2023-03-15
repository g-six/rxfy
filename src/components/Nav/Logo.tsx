import { AgentData } from '@/_typings/agent';
import { ReactNode } from 'react';

export function NavLogo(props: Record<string, unknown>) {
  const { children, agent: data, ...attribs } = props;
  const html = children ? (children as ReactNode) : 'Agent Orange';

  if (data) {
    const agent = data as AgentData;
    if (agent.metatags && agent.metatags.logo_for_dark_bg) {
      return (
        <div
          id='reidget-nav-logo'
          {...attribs}
          style={{
            backgroundImage: `url(${agent.metatags.logo_for_dark_bg})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPositionX: 'left',
            backgroundPositionY: 'center',
          }}
        />
      );
    }
  }

  return (
    <div id='reidget-nav-logo' {...attribs}>
      {html}
    </div>
  );
}

export default NavLogo;
