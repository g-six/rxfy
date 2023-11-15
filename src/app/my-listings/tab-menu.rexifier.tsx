import { Children, ReactElement, cloneElement } from 'react';
import CreateNewListingButton from './private-listing-workspace/components/new-listing-button.component';

function Rexified({ children }: { children: ReactElement }) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        let { className } = c.props;
        if (!className) className = 'rexified';
        if (c.props['data-w-tab']) {
          if (c.props['data-w-tab'] === 'New Private listing') {
            return <CreateNewListingButton className={className}>{c.props.children}</CreateNewListingButton>;
          }
          //   if (c.props['data-w-tab'] === 'Tab 1') {
          //     return cloneElement(
          //       c,
          //       {
          //         className,
          //       },
          //       <RexifiedMLSListings>{c.props.children}</RexifiedMLSListings>,
          //     );
          //   }
          //   return cloneElement(
          //     c,
          //     {
          //       className: `${className || ''}`
          //         .split(' ')
          //         .filter(cn => cn !== 'w--tab-active')
          //         .concat(['w--tab-active', 'rexified'])
          //         .join(' '),
          //     },
          //     <Rexified>{c.props.children}</Rexified>,
          //   );
        }
        return cloneElement(c, {}, <Rexified>{c.props.children}</Rexified>);
      }
    }
    return c;
  });

  return <>{rexified}</>;
}

export default async function MyListingsTabMenu({ children, ...props }: { children: ReactElement; className?: string }) {
  return (
    <nav {...props} data-rx='MyListingsTabMenu'>
      <Rexified>{children}</Rexified>
    </nav>
  );
}
