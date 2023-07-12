'use client';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider, DropTargetMonitor } from 'react-dnd';
import { LovedPropertyDataModel } from '@/_typings/property';
import useEvent, { Events, EventsData } from '@/hooks/useEvent';
import React from 'react';
import RxPropertyCompareCard from './RxPropertyCompareCard';

type Props = { children: React.ReactElement | React.ReactElement[]; className: string };
export interface Card extends LovedPropertyDataModel {
  position?: number;
}
function Iterator(
  p: Props & {
    cards: Card[];
    'include-stats'?: string[];
    moveProperty?: (item_idx: number, replace_idx: number) => void;
    removeCard: (property_id: number) => void;
  },
) {
  const Wrapper = React.Children.map(p.children, (child, idx: number) => {
    if (child.type === 'div') {
      if (child.props?.className?.indexOf('propcompare-card') >= 0) {
        if (idx === 0) {
          return (
            <>
              {p.cards &&
                p.cards.map((property: Card, property_idx: number) => (
                  <RxPropertyCompareCard
                    className={child.props.className}
                    property={property}
                    include-stats={p['include-stats']}
                    key={`compare-item-property-${property.id}`}
                    moveProperty={p.moveProperty}
                    removeCard={() => {
                      if (property.id) p.removeCard(property.id);
                    }}
                  >
                    {child}
                  </RxPropertyCompareCard>
                ))}
            </>
          );
        }
        return <></>;
      }
      return (
        <div className={child.props.className + ' rexified'}>
          <Iterator {...p}>{child.props.children}</Iterator>
        </div>
      );
    }
    return child;
  });
  return <>{Wrapper}</>;
}

function RxCompareDropArea(p: Props) {
  const filterEvent = useEvent(Events.AddPropertyFilter);
  let { filters } = filterEvent.data as unknown as { filters: string[] };
  const [cards, setCards] = React.useState<Card[]>([]);
  const [stats_to_include, setStatsToInclude] = React.useState<string[]>();

  const addPropertyToCompareEvt = useEvent(Events.AddPropertyToCompare);
  const moveProperty = (replace_idx: number, with_idx: number) => {
    if (with_idx !== replace_idx) {
      let source_idx = -1;
      let position = -1;
      cards.forEach((card, i) => {
        if (card.id === with_idx) source_idx = i;
      });
      cards.forEach((card, i) => {
        if (card.id === replace_idx) position = i;
      });
      setCards(prev_state => {
        const move = prev_state.splice(source_idx, 1)[0];
        return [...prev_state.splice(position, 0, move)];
      });
    }
  };

  const removeProperty = (property_id: number) => {
    addPropertyToCompareEvt.fireEvent({
      properties: cards.filter(c => c.id !== property_id),
    } as unknown as EventsData);
  };

  React.useEffect(() => {
    const { properties } = addPropertyToCompareEvt.data as unknown as {
      properties: LovedPropertyDataModel[];
    };
    setCards(properties);
  }, [addPropertyToCompareEvt]);

  React.useEffect(() => {
    if (filters !== undefined) {
      setStatsToInclude(filters);
    }
  }, [filters]);

  return (
    <div className={p.className + ' rexified'}>
      <Iterator {...p} cards={cards} include-stats={stats_to_include} moveProperty={moveProperty} removeCard={removeProperty}>
        {p.children}
      </Iterator>
    </div>
  );
}

export function RxCustomerCompareCanvas(p: Props) {
  return (
    <DndProvider backend={HTML5Backend}>
      <RxCompareDropArea {...p}>{p.children}</RxCompareDropArea>
    </DndProvider>
  );
}
