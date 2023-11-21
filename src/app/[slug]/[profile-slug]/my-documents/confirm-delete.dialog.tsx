import { Children, cloneElement } from 'react';

export default function ConfirmDeleteIterator({
  children,
  onCancel,
  onConfirm,
  ...attr
}: {
  children: React.ReactElement;
  onConfirm: (type: string) => void;
  onCancel: () => void;
  'item-type': string;
}) {
  const Wrapped = Children.map(children, c => {
    if (c.type === 'div') {
      return (
        <div className={c.props.className}>
          <ConfirmDeleteIterator
            item-type={attr['item-type']}
            onCancel={onCancel}
            onConfirm={() => {
              onConfirm(attr['item-type']);
            }}
          >
            {c.props.children}
          </ConfirmDeleteIterator>
        </div>
      );
    }
    if (c.type === 'a') {
      if (`${c.props.children}` === 'Cancel') {
        return cloneElement(c, {
          ...c.props,
          onClick: onCancel,
        });
      }
      if (`${c.props.children}` === 'Delete') {
        return cloneElement(c, {
          ...c.props,
          onClick: onConfirm,
        });
      }
    }
    return c;
  });

  return <>{Wrapped}</>;
}
