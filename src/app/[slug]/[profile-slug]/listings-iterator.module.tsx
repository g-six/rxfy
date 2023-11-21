import { AgentData } from '@/_typings/agent';
import { PropertyDataModel } from '@/_typings/property';
import { Children, ReactElement, cloneElement } from 'react';
import { PropertyCard } from './property-card.component';

interface Props {
  children: ReactElement;
  listings: PropertyDataModel[];
  agent: AgentData;
}
function Iterator({ children, ...props }: Props) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children && typeof c.props?.children !== 'string') {
      if (c.props['data-component'] === 'property_card' && props.listings.length) {
        return (
          <>
            {props.listings.map(l => (
              <div {...c.props} key={l.mls_id}>
                <PropertyCard agent={props.agent} listing={l} data-type={c.props['data-type'] || 'default'}>
                  {c.props.children}
                </PropertyCard>
              </div>
            ))}
          </>
        );
      }
      return cloneElement(c, {}, <Iterator {...props}>{c.props.children}</Iterator>);
    }
    return c;
  });

  return <>{Rexified}</>;
}

export default function AgentListingsIterator({ children, ...props }: Props) {
  if (props.listings.length === 0) return <></>;

  return <Iterator {...props}>{children}</Iterator>;
}
