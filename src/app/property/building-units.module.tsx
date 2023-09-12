import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import React, { Children, ReactElement, cloneElement } from 'react';
import { BuildingUnit } from '../api/properties/types';

function GroupIterator(p: { units: BuildingUnit[]; children: ReactElement; className?: string }) {
  const Rexified = Children.map(p.children, c => {
    if (!c.props.children || typeof c.props?.children === 'string') {
      return c;
    }
    const { children: cc } = c.props;
    return p.units?.length ? (
      p.units.map(unit => {
        const columns = Children.map(cc, col => {
          if (col.props?.['data-field']) {
            let val = '';
            switch (col.props['data-field']) {
              case 'other_unit_number':
                val = `${unit.title.split(' ').reverse().pop()}`;
                break;
              case 'other_unit_beds':
                val = `${unit.beds || 'Studio'} bedroom`;
                break;
              case 'other_unit_sqft':
                val = `${formatValues(unit, 'floor_area')} sqft`;
                break;
              default:
                val = `${formatValues(unit, col.props['data-field'])}`;
                break;
            }
            return cloneElement(<span />, col.props, val);
          }
        });

        return (
          <a key={unit.mls_id} href={`?mls=${unit.mls_id}`} className={classNames(c.props.className, 'hover:underline')}>
            {columns}
          </a>
        );
      })
    ) : (
      <center>N/A</center>
    );
  });
  return <div className={p.className}>{Rexified}</div>;
}

export default function BuildingUnits(p: { children: ReactElement; className?: string; neighbours: BuildingUnit[] }) {
  return (
    <section className={p.className} data-group='building_units'>
      <GroupIterator units={p.neighbours || []}>{p.children}</GroupIterator>
    </section>
  );
}
