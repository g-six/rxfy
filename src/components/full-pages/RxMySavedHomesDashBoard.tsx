'use client';
import { transformMatchingElements } from '@/_helpers/dom-manipulators';
import { AgentData } from '@/_typings/agent';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, ReactNode, cloneElement, useState } from 'react';
import { MLSProperty, LovedPropertyDataModel } from '@/_typings/property';

import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import { Events } from '@/_typings/events';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { LoveDataModel } from '@/_typings/love';
import { WEBFLOW_NODE_SELECTOR } from '@/_typings/webflow';
import RxPropertyCard from '../RxPropertyCard';
import Tabs from '@/_replacers/DashboardSavedHomesPage/Tabs';
import { tabs } from '@/_typings/saved-homes-tabs';
import useEvent from '@/hooks/useEvent';
import IndividualPage from '@/_replacers/DashboardSavedHomesPage/IndividualPage';
type Props = {
  agent_data: AgentData;
  className: string;
  children: ReactNode;
};

export default function RxMySavedHomesDashBoard({ agent_data, className, children }: Props) {
  const [currentTab, setCurrentTab] = useState<string>('');
  const [properties, setProperties] = useState<LovedPropertyDataModel[]>([]);
  // const { fireEvent } = useEvent(Events.LovedItem);
  let local_loves: string[] = [];
  const processLovedHomes = (records: LoveDataModel[]) => {
    const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
    const loved: LovedPropertyDataModel[] = [];
    records.forEach(({ id, property }) => {
      loved.push({
        ...property,
        love: id,
      });
      if (!local_loves.includes(property.mls_id)) {
        local_loves.push(property.mls_id);
      }
    });
    setProperties(loved);
    setData(Events.LovedItem, JSON.stringify(local_loves));
  };
  React.useEffect(() => {
    getLovedHomes().then(response => {
      if (response && response.records) {
        processLovedHomes(response.records);
      }
    });
  }, []);
  console.log(properties, 'rerendered');
  const handleOnCardClick = (id: string) => () => {
    console.log(id);
    document.dispatchEvent(new CustomEvent(Events.LovedItem, { detail: { message: id } }));
    // fireEvent({ message: currentTab });
  };
  const matches = [
    {
      searchFn: searchByClasses(['indiv-map-tabs']),
      transformChild: (child: ReactElement) => {
        return <Tabs child={child} setCurrentTab={setCurrentTab} />;
      },
    },
    {
      //left sidebar with saved properties , shared between each tab
      searchFn: searchByClasses(['properties-column']),
      transformChild: (child: ReactElement) => {
        const [PlaceholderCard] = child.props.children.filter((c: React.ReactElement) =>
          c.props.className.split(' ').includes(WEBFLOW_NODE_SELECTOR.PROPERTY_CARD),
        );
        const propertyCards =
          properties?.length > 0
            ? properties.map((p: LovedPropertyDataModel, sequence_no: number) => {
                const { mls_id: MLS_ID, title: Address, asking_price: AskingPrice, area: Area, beds, baths, sqft, ...listing } = p;
                return (
                  <div key={p.mls_id} onClick={handleOnCardClick(MLS_ID)}>
                    <RxPropertyCard
                      key={p.mls_id}
                      listing={{
                        ...(listing as unknown as MLSProperty),
                        MLS_ID,
                        Address,
                        AskingPrice,
                        Area,
                        L_BedroomTotal: beds || 1,
                        L_TotalBaths: baths || 1,
                        L_FloorArea_Total: sqft || 0,
                      }}
                      sequence={sequence_no}
                      agent={agent_data.id}
                      isLink={false}
                    >
                      {PlaceholderCard}
                    </RxPropertyCard>
                  </div>
                );
              })
            : [];
        return cloneElement(child, {}, [child.props.children[0], ...propertyCards]);
      },
    },
    {
      //individual property tab
      searchFn: searchByClasses(['cd---right-saved-property']),
      transformChild: (child: ReactElement) => {
        return <IndividualPage child={child} />;
      },
    },
    {
      //map tab
      searchFn: searchByClasses(['map-placeholder']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {});
      },
    },
    {
      //compare tab
      searchFn: searchByClasses(['compare-right']),
      transformChild: (child: ReactElement) => {
        return cloneElement(child, {});
      },
    },
  ];
  return <div className={className}>{transformMatchingElements(children, matches)}</div>;
}
