/* eslint-disable @next/next/no-img-element */
import { consoler } from '@/_helpers/consoler';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { Children, ReactElement, cloneElement } from 'react';

interface GroupProps {
  children: ReactElement;
  data: { [k: string]: unknown };
  'data-field-group': string;
  'data-json-ref'?: string;
}

const FILE = 'data-field.group.tsx';

function Iterator({ children, ...props }: GroupProps & { 'is-image-gallery'?: boolean }) {
  const rexifier = Children.map(children, (c, position) => {
    if (c.props) {
      // Webflow gallery implements jquery script voodoo, let's piggy back and change the placeholder images
      if (c.type === 'script' && props['data-json-ref']) {
        if (c.props.type === 'application/json' && c.props.dangerouslySetInnerHTML?.__html) {
          try {
            const json = JSON.parse(c.props.dangerouslySetInnerHTML?.__html);

            if (props.data[props['data-field-group']]) {
              const items = props.data[props['data-field-group']] as unknown[];

              // Example from webflow's image gallery
              //   {
              //     "_id": "example_img",
              //     "origFileName": "image-placeholder.svg",
              //     "fileName": "image-placeholder.svg",
              //     "fileSize": 2063,
              //     "height": 150,
              //     "url": "https://d3e54v103j8qbb.cloudfront.net/img/image-placeholder.svg",
              //     "width": 150,
              //     "type": "image"
              // },
              const ref = json[props['data-json-ref']] as { [k: string]: string }[];
              items.forEach((item, idx) => {
                if (!ref[idx]) {
                  ref.push(ref[0]);
                }
                if (item && ref && ref[idx]) {
                  if (typeof item === 'string') {
                    const { url, src, height, width, href, ...attr } = ref[idx] || (ref[0] as unknown as { [k: string]: string });
                    const file_name = item.split('/').pop() as string;
                    const file_extension = `${file_name.split('.').pop() || ''}`.toLowerCase();
                    const file_url = ['jpg', 'jpeg', 'png', 'gif'].includes(file_extension) ? getImageSized(item, 960) : item;
                    let filenames: { [k: string]: string } = {};
                    Object.keys(attr)
                      .filter(k => k.toLowerCase().includes('filename'))
                      .map(k => {
                        filenames = {
                          ...filenames,
                          [k]: file_name,
                        };
                      });
                    ref[idx] = {
                      _id: ref[idx]._id,
                      height,
                      width,
                      ...filenames,
                      src: src ? file_url : undefined,
                      href: href ? file_url : undefined,
                      url: url ? file_url : undefined,
                    } as unknown as { [k: string]: string };
                  }
                }
              });

              return cloneElement(c, {
                dangerouslySetInnerHTML: {
                  __html: JSON.stringify(json, null, 4),
                },
              });
            }
          } catch (e) {
            consoler('data-field.group.tsx', e);
          }
          // consoler('data-field.group.tsx', props.data[props['data-field-group']]);
        }
      }
      if (c.props?.['data-item-index'] && props['is-image-gallery']) {
        const photos = props.data[props['data-field-group']] as string[];
        const elem_idx = Number(c.props['data-item-index']);
        return cloneElement(
          c,
          {
            tabIndex: elem_idx,
            style: {
              backgroundImage: `url(${getImageSized(photos[elem_idx], 1000)})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            },
          },
          <div

          // srcSet={[500, 800, 1080, 1600, 1800].map(width => `${getImageSized(photos[elem_idx], width)} ${width}w`).join(', ')}
          // src={getImageSized(photos[elem_idx], 800)}
          />,
        );
        if (photos[position]) {
          return cloneElement(c, {
            'data-rexifier': FILE,
            srcSet: [500, 800, 1080, 1600, 1800].map(width => `${getImageSized(photos[position], width)} ${width}w`).join(', '),
            src: getImageSized(photos[position], 200),
          });
        }
      }
      if (c.type === 'img' && props['is-image-gallery']) {
        const photos = props.data[props['data-field-group']] as string[];
        const elem_idx = Number(c.props['data-item-index']);
        if (photos[elem_idx]) {
          return cloneElement(c, {
            'data-rexifier': FILE,
            srcSet: [500, 800, 1080, 1600, 1800].map(width => `${getImageSized(photos[elem_idx], width)} ${width}w`).join(', '),
            src: getImageSized(photos[elem_idx], 200),
          });
        }
      }

      if (c.props.children && typeof c.props.children !== 'string') {
        const { children: sub, ...attribs } = c.props;
        let className = attribs.className || '';
        className = className ? `${className} rexified` : 'rexified';
        return cloneElement(
          c,
          {
            className,
            'data-rexifier': FILE,
          },
          <Iterator {...props}>{sub}</Iterator>,
        );
      }
      return c;
    }
  });
  return <>{rexifier}</>;
}

export default function DataFieldGroup({ children, ...props }: GroupProps) {
  return (
    <Iterator {...props} is-image-gallery={Children.map(children, c => c.type === 'img').length > 0}>
      {children}
    </Iterator>
  );
}
