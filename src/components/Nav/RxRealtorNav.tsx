import { Children, ReactElement, cloneElement } from 'react';

export default function RxRealtorNav({ children }: { children: ReactElement }) {
  const Wrapped = Children.map(children, c => {
    if (c.type === 'div' && c.props.children) {
      const { className, children: sub, ...props } = c.props;
      const class_list = `${className || ''}`.split(' ');

      return cloneElement(
        class_list.join(' ').includes('navigation-full-wrapper') ? <nav /> : <div />,
        {
          className: class_list.filter(cn => cn !== 'w-nav').join(' '),
        },
        <RxRealtorNav>{sub}</RxRealtorNav>,
      );
    }
    return c;
  });
  return <>{Wrapped}</>;
}
