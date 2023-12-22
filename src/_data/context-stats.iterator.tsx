import { Children, ReactElement, cloneElement } from 'react';
import DataAction from './data-action';
import DataComponentGroupItem from './data-component.group';
import DataFieldGroup from './data-field.group';
import DataFieldAtom from './data-field.atom';
import { consoler } from '@/_helpers/consoler';
import { objectToQueryString } from '@/_utilities/url-helper';

const FILE = 'context-stats.iterator.tsx';

export default async function ContextStatsIterator({ children: wrapper, ...props }: { children: ReactElement; dataset: { label: string; value: string }[] }) {
  if (props.dataset?.length) {
    return (
      <>
        {props.dataset.map(row => {
          return cloneElement(wrapper, {}, <Iterator {...row}>{wrapper.props.children}</Iterator>);
        })}
      </>
    );
  }
  return wrapper;
}
function Iterator({ children, ...props }: { children: ReactElement; label: string; value: string }) {
  const rexified = Children.map(children, (c, idx) => {
    if (c.props) {
      const { className, ...attribs } = c.props;
      if (attribs['data-key'] === 'label') return cloneElement(c, {}, props.label);
      if (attribs['data-key'] === 'value') return cloneElement(c, {}, props.value);

      if (attribs.children && typeof attribs.children !== 'string') {
        return cloneElement(
          c,
          {
            'data-rexifier': FILE,
          },
          <Iterator {...props}>{attribs.children}</Iterator>,
        );
      }
    }
    return c;
  });

  return <>{rexified}</>;
}
