'use client';
import { LegacySearchPayload } from '@/_typings/pipeline';
import { PropertyDataModel } from '@/_typings/property';
import { retrievePublicListingsFromPipeline } from '@/_utilities/api-calls/call-legacy-search';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import React, { Children, ReactElement, cloneElement, useEffect, useState } from 'react';

function GroupIterator(p: { units: PropertyDataModel[]; children: ReactElement; className?: string }) {
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
                val = `${unit.building_unit}`;
                break;
              case 'other_unit_beds':
                val = `${unit.beds || 'Studio'} bedroom`;
                break;
              case 'other_unit_sqft':
                val = `${formatValues(unit, 'floor_area')} sqft`;
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

export default function BuildingUnits(p: {
  children: ReactElement;
  className?: string;
  street_number: string;
  address: string;
  postal_zip_code: string;
  'mls-id': string;
}) {
  const [units, setBuildingUnits] = useState<PropertyDataModel[]>([]);

  useEffect(() => {
    retrievePublicListingsFromPipeline({
      from: 0,
      size: 10,
      sort: {
        'data.UpdateDate': 'desc',
      },
      query: {
        bool: {
          filter: [
            {
              match: {
                'data.AddressNumber': p.street_number,
              },
            },
            {
              match: {
                'data.AddressStreet': p.address,
              },
            },
            {
              match: {
                'data.PostalCode_Zip': p.postal_zip_code,
              },
            },
            {
              match: {
                'data.IdxInclude': 'Yes',
              },
            },
            {
              match: {
                'data.Status': 'Active' as string,
              },
            } as unknown as Record<string, string>,
          ],
          should: [],
          must_not: [
            {
              match: {
                'data.MLS_ID': p['mls-id'],
              },
            },
          ],
        },
      },
    } as LegacySearchPayload).then(({ records }: { records: PropertyDataModel[] }) => {
      if (records && records.length) setBuildingUnits(records);
    });
  }, []);

  return (
    <section className={p.className}>
      <GroupIterator units={units}>{p.children}</GroupIterator>
    </section>
  );
}
