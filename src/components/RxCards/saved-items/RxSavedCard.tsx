import React, { ReactElement, cloneElement } from 'react';
import { Events } from '@/_typings/events';
import { LovedPropertyDataModel, MLSProperty } from '@/_typings/property';
import { getData } from '@/_utilities/data-helpers/local-storage-helper';
import { formatValues } from '@/_utilities/data-helpers/property-page';
import { classNames } from '@/_utilities/html-helper';
import useLove from '@/hooks/useLove';

import styles from './RxPropertyCard.module.scss';
import Cookies from 'js-cookie';
import { replaceAllTextWithBraces, tMatch, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { searchByClasses } from '@/_utilities/rx-element-extractor';

type Props = {
  child: ReactElement;
  listing: MLSProperty;
  agentId?: number;
  sequence?: number;
  love?: number;
  addBtnClick?: (e: React.SyntheticEvent) => void;
  isCompared?: boolean;
};

export default function RxSavedCard({ child, listing, love, agentId, addBtnClick = () => {}, isCompared }: Props) {
  const [loved_items, setLovedItems] = React.useState(getData(Events.LovedItem) as unknown as string[]);
  const evt = useLove();
  const isLoved = loved_items && loved_items.includes(listing.MLS_ID);
  React.useEffect(() => {
    if (evt.data?.item && evt.data.item.MLS_ID === listing.MLS_ID) {
      setLovedItems(getData(Events.LovedItem) as unknown as string[]);
    }
  }, [evt.data]);

  const textReplaced: ReactElement = replaceAllTextWithBraces(child, {
    'PropCard Address': listing.Address,
    'PropertyCard Address': listing.Address,
    'PropertyCard Price': formatValues(listing, 'AskingPrice'),
    PArea: listing.Area || listing.City || 'N/A',
    PBd: listing.L_BedroomTotal || 1,
    PBth: listing.L_TotalBaths,
    Psq: listing.L_FloorArea_GrantTotal,
    PYear: listing.L_YearBuilt || ' ',
  }) as ReactElement;
  const handleLoveClick = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (agentId) {
      evt.fireEvent(
        {
          ...listing,
          love: love || 0,
        },
        agentId,
        isLoved,
      );
    }
  };

  const matches: tMatch[] = [
    {
      searchFn: searchByClasses(['propcard-image']),
      transformChild: (child: ReactElement) => {
        const thumbnail = listing && listing.photos && Array.isArray(listing.photos) && listing.photos[0];
        return cloneElement(child, { style: { backgroundImage: `url(${thumbnail})` } });
      },
    },
    {
      searchFn: searchByClasses(['property-card']),
      transformChild: (child: ReactElement) => {
        const prepdClassName = classNames(child?.props?.className, `group`);
        return cloneElement(child, { className: prepdClassName });
      },
    },
    {
      searchFn: searchByClasses(['compare-control-wrapper']),
      transformChild: (child: ReactElement) => {
        const prepdClassName = classNames(child?.props?.className, ` opacity-0 group-hover:opacity-100`);
        return cloneElement(child, { className: prepdClassName });
      },
    },
    {
      searchFn: searchByClasses(['compare-control-default']),
      transformChild: (child: ReactElement) => {
        const prepdClassName = classNames(child?.props?.className, `${isCompared ? 'hidden' : 'flex cursor-pointer'}`);
        return cloneElement(child, { className: prepdClassName, onClick: addBtnClick });
      },
    },
    {
      searchFn: searchByClasses(['compare-control-added']),
      transformChild: (child: ReactElement) => {
        const prepdClassName = classNames(child?.props?.className, `${!isCompared ? 'hidden' : 'flex pointer-events-none'}`);
        return cloneElement(child, { className: prepdClassName });
      },
    },
    {
      searchFn: searchByClasses(['heart-full']),
      transformChild: (child: ReactElement) => {
        const prepdClassName = classNames(child?.props?.className, `${isLoved ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'}`);
        return cloneElement(child, { className: prepdClassName, onClick: handleLoveClick });
      },
    },
    {
      searchFn: searchByClasses(['heart-empty']),
      transformChild: (child: ReactElement) => {
        const prepdClassName = classNames(child?.props?.className, `${isLoved ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'}`);
        return cloneElement(child, { className: prepdClassName, onClick: handleLoveClick });
      },
    },
  ];

  return <>{transformMatchingElements(textReplaced, matches)}</>;
}
