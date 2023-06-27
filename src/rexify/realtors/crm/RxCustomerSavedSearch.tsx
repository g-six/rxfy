import { getSearches } from '@/_utilities/api-calls/call-saved-search';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type Props = { children: React.ReactElement; className?: string; id?: string };

function Iterator(p: Props) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.type === 'div') {
      if (child.props.className === p.className) {
        return <Iterator {...p}>{child.props.children}</Iterator>;
      } else if (child.props.className === 'home-alert-div') {
        return <div className={child.props.className}>card</div>;
      }
    }
    return child;
  });
  return <>{Wrapped}</>;
}

export default function RxCustomerSavedSearch(p: Props) {
  const search = useSearchParams();
  const [saved_search, setSavedSearch] = React.useState();

  React.useEffect(() => {
    if (search.get('customer')) {
      const customer_id = Number(search.get('customer'));
      getSearches(customer_id).then(console.log);
    }
  }, []);

  return <Iterator {...p}>{p.children}</Iterator>;
}
