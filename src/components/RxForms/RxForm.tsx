'use client';

import { ChangeEvent, Children, ReactElement, cloneElement, useEffect } from 'react';
import { RxButton } from '../RxButton';
import { Events, EventsData } from '@/_typings/events';
import useEvent from '@/hooks/useEvent';
import { consoler } from '@/_helpers/consoler';

type Props = {
  children: ReactElement[];
  'form-action'?: string;
};

function Rexifier({ children, ...attr }: Props & { onChange?(data: EventsData): void }) {
  return (
    <>
      {Children.map(children, c => {
        if (c.props) {
          if (c.props.children && typeof c.props.children !== 'string') {
            return cloneElement(c, {}, <Rexifier>{c.props.children}</Rexifier>);
          }
          if (c.type === 'input') {
            switch (c.props.type) {
              case 'submit':
                return (
                  <RxButton id={[Events.ContactForm, 'trigger'].join('-')} rx-event={Events.ContactForm} className={c.props.className}>
                    {c.props.value}
                  </RxButton>
                );
              case 'text':
                return cloneElement(c, {
                  onChange: (evt: ChangeEvent<HTMLInputElement>) => {
                    attr.onChange &&
                      attr.onChange({
                        [evt.currentTarget.name]: evt.currentTarget.value,
                      } as unknown as EventsData);
                  },
                });
            }
          }
          return c;
        }
      })}
    </>
  );
}

const FILE = 'RxForm.tsx';

export default function RxForm({ children, ...attr }: Props) {
  const evt = useEvent((attr['form-action'] || Events.ContactForm) as unknown as Events);
  useEffect(() => {
    if (evt.data) {
      consoler(FILE, evt.data);
    }
  }, [evt.data]);
  return <Rexifier onChange={evt.fireEvent}>{children}</Rexifier>;
}
