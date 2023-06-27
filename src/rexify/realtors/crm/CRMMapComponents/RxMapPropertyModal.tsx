import React from 'react';
import PropertyListModal from '@/components/PropertyListModal';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import { AgentData } from '@/_typings/agent';
import { LovedPropertyDataModel } from '@/_typings/property';

export default function RxMapPropertyModal({ children, className }: { children: React.ReactElement; className: string }) {
  const mapPinHandler = useEvent(Events.LoadLovers);
  const selectPropertyEvt = useEvent(Events.SelectCustomerLovedProperty);
  const [properties, setProperties] = React.useState<LovedPropertyDataModel[]>([]);
  const [x, setX] = React.useState<number>(0);
  const [y, setY] = React.useState<number>(0);

  React.useEffect(() => {
    const p = mapPinHandler.data as unknown as {
      selected_pin: LovedPropertyDataModel[];
      x: number;
      y: number;
    };
    setX(p.x);
    setY(p.y);
    setProperties(p.selected_pin || []);
  }, [mapPinHandler.data]);

  React.useEffect(() => {
    const p = mapPinHandler.data as unknown as {
      selected_pin: LovedPropertyDataModel[];
      x: number;
      y: number;
    };
    setX(p.x);
    setY(p.y);
    setProperties(p.selected_pin || []);
  }, []);

  return (
    <div className='w-full max-w-xs fixed' style={{ top: x, left: y }}>
      <PropertyListModal
        card={children}
        properties={properties || []}
        view-only
        onClick={(listing: LovedPropertyDataModel) => {
          let p = {
            ...listing,
          };
          if (listing.photos && typeof listing.photos === 'string') {
            p = {
              ...p,
              photos: JSON.parse(listing.photos),
            };
          }
          const btn = document.querySelector('button#w-tabs-0-data-w-tab-0') as HTMLButtonElement;
          selectPropertyEvt.fireEvent(p as unknown as EventsData);
          btn.click();
          setProperties([]);
        }}
        onClose={() => {
          setProperties([]);
        }}
      ></PropertyListModal>
    </div>
  );
}
