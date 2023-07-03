'use client';
import React, { cloneElement, useEffect, useState } from 'react';
import { ReplacerPageProps } from '@/_typings/forms';
import { captureMatchingElements, removeMatchingElements, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import EditNewCardForm from '@/_replacers/SmartBusinessCard/EditNewCardForm';
import { getSmartCards } from '@/_utilities/api-calls/call-smart-cards';
import SmartCard from '@/_replacers/SmartBusinessCard/SmartCard';
import { SmartCardResponse } from '@/_typings/smart-cards';

export default function RxSmartBusinessCard({ nodes }: ReplacerPageProps) {
  const [cards, setCards] = useState<SmartCardResponse[]>([]);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const captured = captureMatchingElements(removeMatchingElements(nodes, [{ searchFn: searchByClasses(['smart-cards']) }]), [
    { searchFn: searchByClasses(['f-testimonial-card']), elementName: 'card' },
  ]);
  const [details, setDetails] = useState<SmartCardResponse | any>();
  useEffect(() => {
    getSmartCards().then(res => {
      if (res?.records?.length > 0) {
        setCards(res.records);
      }
    });
  }, []);
  const updateCardsList = (actionName: string, data: SmartCardResponse) => {
    let newArr = [...cards];
    if (actionName === 'delete') {
      newArr = newArr.filter(item => item.id !== data.id);
    } else if (actionName === 'new') {
      newArr.unshift(data);
    } else if (actionName === 'update') {
      newArr.map(item => (item.id === data.id ? data : item));
    }
    console.log(newArr);
    setShowDetails(false);
    setCards(newArr);
  };
  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['edit-new-card']),
      transformChild: child => <EditNewCardForm template={child} showDetails={showDetails} details={details} updateCardsList={updateCardsList} />,
    },
    {
      searchFn: searchByClasses(['order-button']),
      transformChild: child =>
        cloneElement(child, {
          onClick: () => {
            setShowDetails(true);
            setDetails({ name: undefined, title: undefined, logo_url: undefined });
          },
        }),
    },
    {
      searchFn: searchByClasses(['smart-cards-temp']),
      transformChild: child =>
        cloneElement(
          child,
          {},
          cards?.length > 0
            ? cards.map((item, i) => (
                <SmartCard
                  isActive={details?.id === item.id}
                  template={captured.card}
                  item={item}
                  key={item.id}
                  onClick={() => {
                    setDetails(item), setShowDetails(true);
                  }}
                />
              ))
            : [],
        ),
    },
  ];
  return <>{transformMatchingElements(nodes, matches)}</>;
}
