import { consoler } from '@/_helpers/consoler';
import { Children, ReactElement, cloneElement } from 'react';
import DataInputAtom from './data-input';
import DataAction from './data-action';
import { cookies } from 'next/headers';
import DataShowOn from './data-show.client-component';
import DataModal from './data-modal.client-component';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { capitalizeFirstLetter } from '@/_utilities/formatters';
import BaseClientComponent from './base.client-component';

const FILE = 'data-field.atom.tsx';

async function AtomIterator({
  children,
  data,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
}) {
  const rexifier = Children.map(children, c => {
    if (c.props) {
      const { children: sub, ...attribs } = c.props;
      let className = attribs.className || '';
      className = className ? `${className} rexified` : 'rexified';

      if (data) {
        let value = '';
        let field = attribs['data-field'] || '';

        if (attribs['data-image']) field = attribs['data-image'];

        if (attribs['data-fields']) {
          value = attribs['data-fields']
            .split(',')
            .map((f: string) => {
              if (f === 'title') return capitalizeFirstLetter(`${data[f]}`.toLowerCase());
              return data[f] as string;
            })
            .filter((v: string) => !!v)
            .join(', ') as string;
        } else if (field) {
          if (field === 'address') {
            field = 'title';
          }
          value = data[field] as string;
          if (attribs['data-display-as'] && !isNaN(Number(value))) {
            value = '$' + new Intl.NumberFormat(undefined, {}).format(Number(value));
          }
          if (field === 'cover_photo') {
            if (data.photos) {
              value = (data.photos as string[]).reverse().pop() as string;
            }
          }

          if (!value && props['fallback-context'] && data[props['fallback-context']]) {
            const { [field]: v } = data[props['fallback-context']] as { [k: string]: string };
            value = v;
          }

          if (attribs['data-image'] && value && c.type !== 'img') {
            return cloneElement(c, {
              'data-rexifier': FILE,
              style: {
                backgroundImage: `url(${value})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'contain',
                color: 'rgba(0, 0, 0, 0)',
              },
            });
          }

          if (c.type === 'img' && value) {
            let srcSet = undefined;

            if (c.props.srcSet) {
              // If the <img> object contains sources for images of different sizes
              srcSet = c.props.srcSet
                .split(', ')
                .map((version: string) => {
                  const width = Number(`${version.split(' ').pop()}`.replace(/\D/g, ''));
                  return getImageSized(value, width) + ` ${version.split(' ').pop()}`;
                })
                .join(', ');
              return (
                <BaseClientComponent
                  component={cloneElement(c, {
                    src: value,
                    'data-original-src': c.props.src,
                    'data-original-src-set': c.props.srcSet,
                    srcSet,
                  })}
                />
              );
            }
            return cloneElement(c, {
              src: value,
              srcSet,
              'data-rexifier': FILE,
            });
          }
          if (c.type === 'svg') {
            return cloneElement(<img />, {
              src: value,
              'data-rexifier': FILE,
            });
          }

          return cloneElement(
            c,
            {
              className,
              'data-rexifier': FILE,
            },
            value,
          );
        }

        if (value) {
          return cloneElement(
            c,
            {
              'data-rexifier': FILE,
            },
            value,
          );
        }

        if (attribs['data-show-on']) {
          return <DataShowOn {...attribs} element={c} />;
        }

        // Input
        if (attribs['data-input'] && attribs['data-form']) {
          return (
            <DataInputAtom {...props} data={data} data-form={attribs['data-form']}>
              {c}
            </DataInputAtom>
          );
        }

        if (attribs['data-action']) {
          return (
            <DataAction {...attribs} {...props} data={data}>
              {c}
            </DataAction>
          );
        } else if (attribs['data-modal']) {
          return <DataModal {...attribs} {...props} data={data} element={c} />;
        } else if (attribs['data-filter']) {
          const filter = attribs['data-filter'];
          if (filter) {
            // const { [filter]: dataset } = data[data_context] as unknown as {
            //   [k: string]: unknown[];
            // };
            // if (dataset?.length) {
            //   return cloneElement(
            //     c,
            //     {
            //       className,
            //     },
            //     <ContextListIterator {...props} dataset={dataset} data={props.data} {...attribs}>
            //       {sub}
            //     </ContextListIterator>,
            //   );
            // }
          }
          return <></>;
        }
      }

      if (c.props.children && typeof c.props.children !== 'string') {
        return cloneElement(
          c,
          {
            className,
            'data-rexifier': FILE,
          },
          <AtomIterator data={data} {...props}>
            {sub}
          </AtomIterator>,
        );
      }

      return c;
    }
  });
  return <>{rexifier}</>;
}

export default async function DataFieldAtom({
  children,
  ...props
}: {
  children: ReactElement;
  data?: { [k: string]: unknown };
  'data-context': string;
  contexts: { [k: string]: { [k: string]: unknown } };
  'fallback-context': string;
}) {
  return <AtomIterator {...props}>{children}</AtomIterator>;
}
