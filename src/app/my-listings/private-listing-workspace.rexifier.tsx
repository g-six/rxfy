import { AgentData } from '@/_typings/agent';
import { Children, ReactElement, cloneElement } from 'react';
import MyListingsWorkspacePanels from './private-listing-workspace/panels.rexifier';
import { getPrivateListing } from '../api/private-listings/model';
import NotFound from '../not-found';
import { PrivateListingModel } from '@/_typings/private-listing';

function Rexify({ children, ...data }: { agent: AgentData; children: ReactElement; listing?: PrivateListingModel }) {
  const Rexified = Children.map(children, c => {
    if (c.props && c.props.children && typeof c.props.children !== 'string') {
      let { children: components, className = '', ...props } = c.props;
      className = `${className}${className && ' '}rexified`;

      // Rexify workspace tabs
      if (className.includes('tab-content')) {
        return cloneElement(
          c,
          { className, 'data-rx': 'MyListingsWorkspacePanels' },
          <MyListingsWorkspacePanels {...data}>{components}</MyListingsWorkspacePanels>,
        );
      }

      return cloneElement(c, { className }, <Rexify {...data}>{components}</Rexify>);
    }
    return c;
  });
  return <>{Rexified}</>;
}

export default async function MyListingsPrivateListingsWorkspace({
  children,
  agent,
  searchParams,
  ...props
}: {
  children: ReactElement;
  agent: AgentData;
  className?: string;
  searchParams: {
    [k: string]: string;
  };
}) {
  let listing: PrivateListingModel | undefined = undefined;
  const id = Number(searchParams.id || 0);

  // User wants to edit a private listing with given id
  if (id) {
    listing = await getPrivateListing(id, false);
    if (!listing) return <NotFound />;
  }

  return (
    <div {...props} data-agent={agent.agent_id} data-id={id}>
      <Rexify agent={agent} listing={listing}>
        {children}
      </Rexify>
    </div>
  );
}
