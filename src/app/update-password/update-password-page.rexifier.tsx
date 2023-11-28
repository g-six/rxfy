import { Children, ReactElement, cloneElement } from 'react';
import UpdatePasswordButton from './components/button.component';
import UpdatePasswordInputComponent from './components/password-input.component';
import UpdatePasswordPage from './page';
import { headers } from 'next/headers';

export default function UpdatePasswordPageRexifier({ children, ...props }: { children: ReactElement }) {
  const Rexified = Children.map(children, c => {
    if (c.props?.children && typeof c.props.children !== 'string') {
      if (c.type === 'form') {
        return (
          <main className={c.props?.classname || ''}>
            <UpdatePasswordPageRexifier {...c.props}>{c.props.children}</UpdatePasswordPageRexifier>
          </main>
        );
      }
      const { children: sub, ...subprops } = c.props;
      return cloneElement(c, { 'data-rx': 'update-password/update-password-page.rexifier' }, <UpdatePasswordPageRexifier>{sub}</UpdatePasswordPageRexifier>);
    }
    if (c.props?.['type'] === 'password') {
      return <UpdatePasswordInputComponent {...c.props} />;
    }
    if (c.props?.['type'] === 'submit') {
      const { value: sub, ...subprops } = c.props;
      return (
        <UpdatePasswordButton {...subprops} is-realtor={headers().get('x-url')?.includes('leagent-website')}>
          {sub}
        </UpdatePasswordButton>
      );
    }
    return c;
  });
  return <>{Rexified}</>;
}
