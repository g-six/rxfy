import { Children, ReactElement, cloneElement } from 'react';
import { InputClientComponentRexifier } from './input-rexifier.client-component';
import { AgentData } from '@/_typings/agent';

type Props = { children: ReactElement; 'data-form': string; agent?: AgentData };
const FILE = 'form-rexifier.server-component.tsx';
function Iterator({ children, ...props }: Props) {
  const Rexified = Children.map(children, c => {
    if (c.props) {
      if (props['data-form']) {
        if (c.props['data-action'] || c.props['data-input']) {
          return <InputClientComponentRexifier data-form={props['data-form']} {...c.props} agent={props.agent} />;
        }
      }
      if (c.props.children && typeof c.props.children !== 'string') {
        if (c.type === 'form') {
          return (
            <div {...c.props} rx-rexifier={FILE}>
              <Iterator {...props}>{c.props.children}</Iterator>
            </div>
          );
        }
        return cloneElement(
          c,
          {
            'rx-rexifier': FILE,
          },
          <Iterator {...props}>{c.props.children}</Iterator>,
        );
      }
    }
    return c;
  });
  return <>{Rexified}</>;
}

export default async function FormServerComponentRexifier({ children, ...props }: Props) {
  return <Iterator {...props}>{children}</Iterator>;
}
