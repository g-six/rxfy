'use client';
import { captureMatchingElements, transformMatchingElements } from '@/_helpers/dom-manipulators';
import { AgentData } from '@/_typings/agent';
import { searchByClasses } from '@/_utilities/rx-element-extractor';
import React, { ReactElement, ReactNode, useState } from 'react';
import { LovedPropertyDataModel } from '@/_typings/property';
import { getData, setData } from '@/_utilities/data-helpers/local-storage-helper';
import { Events } from '@/_typings/events';
import { getLovedHomes } from '@/_utilities/api-calls/call-love-home';
import { LoveDataModel } from '@/_typings/love';

import IndividualTab from '@/_replacers/DashboardSavedHomesPage/IndividualTab';
// import { RxMapbox } from '../RxMapbox';
// import MapProvider from '@/app/AppContext.module';
import CompareTab from '@/_replacers/DashboardSavedHomesPage/CompareTab';
import { fireCustomEvent } from '@/_helpers/functions';

import SavedItemsColumn from '@/_replacers/DashboardSavedHomesPage/SavedItemsColumn';

type Props = {
  agent_data: AgentData;
  className: string;
  children: ReactNode;
  config: {
    authorization: string;
    url: string;
  };
};

export default function RxMySavedHomesDashBoard({ agent_data, className, children, config }: Props) {
  // const [currentTab, setCurrentTab] = useState<string>('');
  const [loved, setLoved] = useState<LovedPropertyDataModel[]>([]);

  const processLovedHomes = async (records: LoveDataModel[]) => {
    const local_loves = (getData(Events.LovedItem) as unknown as string[]) || [];
    const loved: LovedPropertyDataModel[] = [];

    records.forEach(async ({ id, property }) => {
      loved.push({
        ...property,
        love: id,
      });

      if (!local_loves.includes(property.mls_id)) {
        local_loves.push(property.mls_id);
      }
    });

    setLoved(loved);
    setData(Events.LovedItem, JSON.stringify(local_loves));
  };
  React.useEffect(() => {
    getLovedHomes().then(response => {
      if (response && response.records) {
        processLovedHomes(response.records);
        const firstMLS_ID = response.records?.[0]?.property?.mls_id;
        if (firstMLS_ID) {
          fireCustomEvent({ mls_id: firstMLS_ID }, Events.SavedItemsIndivTab);
        }
      }
    });
  }, []);
  const matches = [
    // {
    //   searchFn: searchByClasses(['indiv-map-tabs']),
    //   transformChild: (child: ReactElement) => {
    //     return <Tabs child={child} setCurrentTab={setCurrentTab} />;
    //   },
    // },
    {
      //left sidebar with saved loved , shared between each tab
      searchFn: searchByClasses(['properties-column']),
      transformChild: (child: ReactElement) => {
        return <SavedItemsColumn loved={loved} child={child} agent_data={agent_data} />;
      },
    },
    {
      //individual property tab
      searchFn: searchByClasses(['property-body-wrapper']),
      transformChild: (child: ReactElement) => {
        return <IndividualTab child={child} agent_data={agent_data} />;
      },
    },
    // {
    //   //map tab
    //   searchFn: searchByClasses(['map-placeholder']),
    //   transformChild: (child: ReactElement) => {
    //     const Div = (props: any) => React.createElement('div', { agent_data }, [,]);
    //     console.log(agent_data);
    //     return (
    //       <MapProvider>
    //         <RxMapbox
    //           agent_data={agent_data}
    //           key='0'
    //           headers={{
    //             Authorization: config.authorization,
    //           }}
    //           search_url=''
    //           agent={agent_data}
    //           token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
    //           setListings={setProperties}
    //         />
    //       </MapProvider>
    //     );
    //   },
    // },
    {
      //compare tab
      searchFn: searchByClasses(['compare-tab']),
      transformChild: (child: ReactElement) => {
        return <CompareTab child={child} />;
      },
    },
  ];
  return <div className={className}>{transformMatchingElements(children, matches)}</div>;
}
