import { Children, ReactElement, cloneElement } from 'react';
import MyListingsMLSListings from './mls-listings.rexifier';
import { AgentData } from '@/_typings/agent';
import MyListingsPrivateListingWorkspace from './private-listing-workspace.rexifier';
import MyListingsPrivateListings from './private-listings.rexifier';
import CreateNewListingButton from './private-listing-workspace/components/new-listing-button.component';
import { PrivateListingOutput } from '@/_typings/private-listing';

interface Props {
  agent: AgentData;
  className?: string;
  children: ReactElement;
  params: { [k: string]: string };
  searchParams: { [k: string]: string };
  private_listings?: PrivateListingOutput[];
}

function Rexified({ agent, children, params, searchParams }: Props) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        let { className, children: components, ...props } = c.props;
        if (!className) className = '';
        className = `${className} rexified`;

        if (props['data-group'] === 'mls_listings') {
          return (
            <MyListingsMLSListings {...props} className={className} agent={agent}>
              {components}
            </MyListingsMLSListings>
          );
        }

        if (props['data-group'] === 'private_listings') {
          return (
            <MyListingsPrivateListings {...props} className={className} agent={agent}>
              {components}
            </MyListingsPrivateListings>
          );
        }

        if (className.includes('tab-pane-private-listings')) {
          return (
            <MyListingsPrivateListingWorkspace {...props} {...{ params, searchParams }} agent={agent} className={className}>
              {components}
            </MyListingsPrivateListingWorkspace>
          );
        }

        return cloneElement(
          c,
          { className },
          <Rexified
            agent={agent}
            {...{
              params,
              searchParams,
            }}
          >
            {c.props.children}
          </Rexified>,
        );
      }
    }

    if (c.props?.['data-action'] === 'new_private_listing') {
      return <CreateNewListingButton className={c.props.className}>{c.props.children}</CreateNewListingButton>;
    }
    return c;
  });

  return <>{rexified}</>;
}

export default async function MyListingsTabContents({ agent, children, params, searchParams, ...props }: Props) {
  return (
    <aside {...props} data-rx='MyListingsTabContents'>
      <Rexified {...{ params, searchParams }} agent={agent}>
        {children}
      </Rexified>
    </aside>
  );
}
