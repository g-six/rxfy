//saved-home-detail-panel
'use client';
import React from 'react';
import { PropertyDataModel } from '@/_typings/property';
import useEvent, { Events } from '@/hooks/useEvent';
import { getImageSized } from '@/_utilities/data-helpers/image-helper';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import RxPropertyMaps from '@/components/RxProperty/RxPropertyMaps';
import RxPropertyStats from '@/components/RxProperty/RxPropertyStats';
import { AgentData } from '@/_typings/agent';
import styles from './CustomerPropertyView.module.scss';
import RxActionBar from './CRMPropertyPageComponents/RxActionBar';

type Props = {
  children: React.ReactElement;
  id?: string;
  agent?: AgentData;
  className?: string;
  reload: (r: unknown) => void;
};

function Iterator(p: Props & { property?: PropertyDataModel }) {
  const Wrapped = React.Children.map(p.children, child => {
    if (child.props?.children || child.props?.className) {
      if (child.type === 'div') {
        if (child.props.children?.type === 'img') {
          if (p.property?.photos?.length) {
            switch (child.props.children.props.className) {
              case 'view-only-main-image':
                return React.cloneElement(child, {
                  ...child.props,
                  children: React.cloneElement(child.props.children, {
                    ...child.props.children.props,
                    src: getImageSized(p.property.photos[0], 780),
                    srcSet: undefined,
                  }),
                });
              case 'property-image-2':
                if (p.property.photos.length > 1)
                  return React.cloneElement(child, {
                    ...child.props,
                    children: React.cloneElement(child.props.children, {
                      ...child.props.children.props,
                      src: getImageSized(p.property.photos[1], 580),
                    }),
                    srcSet: undefined,
                  });
              case 'property-image-3':
                if (p.property.photos.length > 2)
                  return React.cloneElement(child, {
                    ...child.props,
                    children: React.cloneElement(child.props.children, {
                      ...child.props.children.props,
                      src: getImageSized(p.property.photos[2], 580),
                      srcSet: undefined,
                    }),
                  });
            }
          }
        } else if (p.property?.photos && p.property.photos.length > 2 && child.props.className === 'property-image-collection') {
          return React.cloneElement(child, {
            ...child.props,
            children: p.property.photos.slice(3, 7).map(src => {
              return React.cloneElement(child.props.children[0], {
                ...child.props.children[0].props,
                key: src,
                src: getImageSized(src, 400),
              });
            }),
          });
        } else if (typeof child.props.children === 'string') {
          switch (child.props.children) {
            case '{Price}':
              return React.cloneElement(child, {
                children: p.property?.asking_price ? '$' + new Intl.NumberFormat().format(p.property.asking_price) : 'N.A.',
              });
            case '{Address}':
              return React.cloneElement(child, {
                children: p.property?.title,
              });
            case '{Area}':
              return React.cloneElement(child, {
                children: p.property?.subarea_community || p.property?.area,
              });
            case '{Beds}':
              return React.cloneElement(child, {
                children: p.property?.beds || 'N/A',
              });
            case '{Baths}':
              return React.cloneElement(child, {
                children: p.property?.baths || 'N/A',
              });
            case '{Description}':
              return p.property?.description ? (
                React.cloneElement(child, {
                  children: p.property?.description,
                })
              ) : (
                <></>
              );
            case '{Year Built}':
              return React.cloneElement(child, {
                children: p.property?.year_built || 'N/A',
              });
            case '{Sqft}':
              return React.cloneElement(child, {
                children: new Intl.NumberFormat().format(p.property?.floor_area_total || p.property?.floor_area_main || 0) || 'N/A',
              });
            case '{Listing By}':
              return p.property?.listing_by ? (
                React.cloneElement(child, {
                  children: p.property?.listing_by,
                })
              ) : (
                <></>
              );
            case '{MLS Number}':
              return React.cloneElement(child, {
                children: p.property?.mls_id || 'N/A',
              });
            case '{Land Title}':
              return React.cloneElement(child, {
                children: p.property?.land_title || 'N/A',
              });
            case '{Price Per Sqft}':
              return React.cloneElement(child, {
                children: p.property?.price_per_sqft ? `$${p.property.price_per_sqft}` : 'N/A',
              });
            case '{Property Tax}':
              return React.cloneElement(child, {
                children: (() => {
                  let ret = 'N/A';
                  if (p.property?.gross_taxes) {
                    ret = '$' + new Intl.NumberFormat().format(p.property.gross_taxes) + ' ';
                  }
                  if (p.property?.tax_year) {
                    ret = `${ret} (${p.property.tax_year})`;
                  }
                  return ret;
                })(),
              });
            case '{Building Type}':
              return React.cloneElement(child, {
                children: p.property?.building_type || p.property?.property_type || p.property?.style_type || 'N/A',
              });
            case '{Lot Size}':
              return React.cloneElement(child, {
                children: (() => {
                  if (p.property?.lot_sqft) {
                    return new Intl.NumberFormat().format(p.property.lot_sqft) + 'sqft';
                  }
                  if (p.property?.lot_sqm) {
                    return new Intl.NumberFormat().format(p.property.lot_sqm) + 'sqm';
                  }
                  return 'N/A';
                })(),
              });
          }
        } else if (child.props.className === WEBFLOW_NODE_SELECTOR.PROPERTY_MAPS) {
          return p.property && p.property.lon && p.property.lat ? <RxPropertyMaps child={child} property={p.property} /> : <></>;
        } else if (child.props.className?.indexOf(WEBFLOW_NODE_SELECTOR.PROPERTY_TOP_STATS) >= 0) {
          return (
            <RxActionBar {...p} {...child.props} agent={p.agent?.agent_id} slug={p.agent?.metatags?.profile_slug}>
              {child}
            </RxActionBar>
          );
        } else if (child.props.className?.split(' ').includes('little-profile-card')) {
          return React.cloneElement(child, {
            ...child.props,
            children: React.Children.map(child.props.children, cardelement => {
              if (cardelement.type === 'img' && p.agent?.metatags) {
                const photo = p.agent.metatags.profile_image || p.agent.metatags?.logo_for_light_bg || p.agent.metatags?.logo_for_dark_bg || '';
                return photo ? (
                  React.cloneElement(cardelement, {
                    ...cardelement.props,
                    src: getImageSized(photo, 100),
                  })
                ) : (
                  <></>
                );
              } else if (cardelement.type === 'div') {
                return (
                  <div className='flex flex-col gap-1'>
                    <h5 className='py-0 my-0'>{p.agent?.full_name}</h5>
                    <p className='text-sm my-0 py-0'>{p.agent?.phone}</p>
                  </div>
                );
              }
            }),
          });
        } else if (p.agent && child.props.className?.split(' ').includes('section-big-stats')) {
          return <RxPropertyStats property={p.property} child={child} agent={p.agent} />;
        }
        return (
          <div {...child.props}>
            <Iterator {...p}>{child.props.children}</Iterator>
          </div>
        );
      }
    }
    return child;
  });

  return <>{Wrapped}</>;
}

export default function RxCustomerPropertyView(p: Props) {
  const session = useEvent(Events.LoadUserSession);
  const selectPropertyEvt = useEvent(Events.SelectCustomerLovedProperty);
  const [property, selectProperty] = React.useState<PropertyDataModel>();
  const agent = session.data as unknown as AgentData;

  React.useEffect(() => {
    if (selectPropertyEvt.data) {
      selectProperty(selectPropertyEvt.data as unknown as PropertyDataModel);
    }
  }, [selectPropertyEvt.data]);

  const { reload, ...props } = p;
  return (
    <div {...props} className={`${p.className} ${property?.id ? styles['opened-property-view'] : styles['closed-property-view']}`}>
      <Iterator {...props} property={property} agent={agent} reload={reload}>
        {p.children}
      </Iterator>
    </div>
  );
}
