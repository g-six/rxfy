import { Children, ReactElement, cloneElement } from 'react';
import CreateNewListingButton from './private-listing-workspace/components/new-listing-button.component';
import { classNames } from '@/_utilities/html-helper';
import MyListingsHomeButton from './private-listing-workspace/components/home-button.component';

function Rexified({ children, ...props }: { children: ReactElement; 'active-tab'?: 'tab 1' | 'new private listing'; 'data-w-id'?: string }) {
  const rexified = Children.map(children, c => {
    if (c.props) {
      if (c.props.children && typeof c.props.children !== 'string') {
        let { className } = c.props;
        if (!className) className = 'rexified';
        if (c.props['data-w-tab']) {
          if (c.props['data-w-tab'] === 'New Private listing') {
            return (
              <CreateNewListingButton {...props} className={classNames(className || '', props['active-tab'] === 'new private listing' ? 'w--current' : '')}>
                {c.props.children}
              </CreateNewListingButton>
            );
          } else {
            return (
              <MyListingsHomeButton {...props} className={classNames(className || '', props['active-tab'] === 'tab 1' ? 'w--current' : '')}>
                {c.props.children}
              </MyListingsHomeButton>
            );
          }
        }
        return cloneElement(c, {}, <Rexified>{c.props.children}</Rexified>);
      }
    }
    return c;
  });

  return <>{rexified}</>;
}

export default async function MyListingsTabMenu({
  children,
  'active-tab': active_tab,
  ...props
}: {
  children: ReactElement;
  className?: string;
  'active-tab'?: 'tab 1' | 'new private listing';
}) {
  return (
    <nav {...props} data-rx='MyListingsTabMenu'>
      <Rexified active-tab={active_tab}>{children}</Rexified>
    </nav>
  );
}
