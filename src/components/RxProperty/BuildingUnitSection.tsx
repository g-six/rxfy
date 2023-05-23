import { ReactElement } from 'react';

export function BuildingUnitSection({ properties }: { properties: ReactElement[] }) {
  return <div className='div-building-units-on-sale'>{properties}</div>;
}

function BuildingUnitRow() {}
